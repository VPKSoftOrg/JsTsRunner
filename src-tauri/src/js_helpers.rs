/*
MIT License

Copyright (c) 2024 VPKSoft

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

use std::sync::Mutex;

use crate::types::LineByLineLog;

static mut LOG_STACK: Mutex<Vec<String>> = Mutex::new(vec![]);
static mut LOG_STACK_LINES: Mutex<Vec<LineByLineLog>> = Mutex::new(vec![]);
static mut FILE_LINE: Mutex<Option<i32>> = Mutex::new(None);

/// Formats the v8 log call arguments to a string.
///
/// # Arguments
/// * `scope` - The v8 scope.
/// * `args` - The v8 arguments.
///
/// # Returns
/// The formatted log call string.
fn format_js_log(scope: &mut v8::HandleScope, args: v8::FunctionCallbackArguments) -> String {
    let mut result: Vec<String> = Vec::new();
    let length = args.length();
    for i in 0..length {
        let arg = args
            .get(i)
            .to_string(scope)
            .unwrap()
            .to_rust_string_lossy(scope);
        result.push(arg);
    }

    let result = result.join(" ");

    result
}

/// Pushes a new captured log call values to the log stack.
///
/// # Arguments
/// * `scope` - The v8 scope.
/// * `args` - The v8 arguments.
/// * `_rv` - The v8 return value.
pub fn js_console_log_capture(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut _rv: v8::ReturnValue,
) {
    push_log_stack(format!("LOG: {}", format_js_log(scope, args)));
}

/// Pushes a new captured warn call values to the log stack.
///
/// # Arguments
/// * `scope` - The v8 scope.
/// * `args` - The v8 arguments.
/// * `_rv` - The v8 return value.
pub fn js_console_warn_capture(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut _rv: v8::ReturnValue,
) {
    push_log_stack(format!("WARN: {}", format_js_log(scope, args)));
}

/// Pushes a new captured error call values to the log stack.
///
/// # Arguments
/// * `scope` - The v8 scope.
/// * `args` - The v8 arguments.
/// * `_rv` - The v8 return value.
pub fn js_console_error_capture(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut _rv: v8::ReturnValue,
) {
    push_log_stack(format!("ERROR: {}", format_js_log(scope, args)));
}

/// Pushes a new captured log call values to the log stack.
///
/// # Arguments
/// * `scope` - The v8 scope.
/// * `args` - The v8 arguments.
/// * `_rv` - The v8 return value.
pub fn js_console_log_capture_lines(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut _rv: v8::ReturnValue,
) {
    push_log_stack_file_line(format!("LOG: {}", format_js_log(scope, args)));
}

/// Pushes a new captured warn call values to the log stack.
///
/// # Arguments
/// * `scope` - The v8 scope.
/// * `args` - The v8 arguments.
/// * `_rv` - The v8 return value.
pub fn js_console_warn_capture_lines(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut _rv: v8::ReturnValue,
) {
    push_log_stack_file_line(format!("WARN: {}", format_js_log(scope, args)));
}

/// Pushes a new captured error call values to the log stack.
///
/// # Arguments
/// * `scope` - The v8 scope.
/// * `args` - The v8 arguments.
/// * `_rv` - The v8 return value.
pub fn js_console_error_capture_lines(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut _rv: v8::ReturnValue,
) {
    push_log_stack_file_line(format!("ERROR: {}", format_js_log(scope, args)));
}

/// Pushes a specified value to the log stack.
///
/// # Arguments
/// * `value` - The value to push.
pub fn push_log_stack(value: String) {
    unsafe {
        match LOG_STACK.lock() {
            Ok(mut stack) => {
                stack.push(value);
            }
            Err(_) => {}
        }
    }
}

pub fn set_file_line(file_line: Option<i32>) {
    unsafe {
        match FILE_LINE.lock() {
            Ok(mut file_line_mutex) => {
                *file_line_mutex = file_line;
            }
            Err(_) => {}
        }
    }
}

pub fn push_log_stack_file_line(value: String) {
    unsafe {
        match FILE_LINE.lock() {
            Ok(file_line) => match *file_line {
                Some(file_line) => {
                    match LOG_STACK_LINES.lock() {
                        Ok(mut log_stack) => {
                            let stack = log_stack
                                .iter_mut()
                                .find(|line| line.line_number == file_line);

                            match stack {
                                Some(stack) => {
                                    stack.lines.push(value);
                                }
                                None => {
                                    log_stack.push(LineByLineLog {
                                        line_number: file_line,
                                        lines: vec![value],
                                    });
                                }
                            }
                        }
                        Err(_) => {
                            push_log_stack(value);
                        }
                    };
                }
                None => {
                    push_log_stack(value);
                }
            },
            Err(_) => {
                push_log_stack(value);
            }
        }
    }
}

/// Clears the log stack.
pub fn clear_log_stack() {
    unsafe {
        match LOG_STACK.lock() {
            Ok(mut stack) => {
                stack.clear();
            }
            Err(_) => {}
        }

        match LOG_STACK_LINES.lock() {
            Ok(mut stack) => {
                stack.clear();
            }
            Err(_) => {}
        }

        match FILE_LINE.lock() {
            Ok(mut file_line) => {
                *file_line = None;
            }
            Err(_) => {}
        }
    }
}

/// Gets the log stack.
///
/// # Returns
/// The log stack as a vector of strings.
pub fn get_log_stack() -> Vec<String> {
    unsafe {
        match LOG_STACK.lock() {
            Ok(stack) => stack.clone(),
            Err(_) => vec![],
        }
    }
}

/// Gets the log stack by file line.
///
/// # Returns
/// The log stack as a vector of file line numbers and their corresponding lines.
pub fn get_log_stack_by_file_line() -> Vec<LineByLineLog> {
    unsafe {
        match LOG_STACK_LINES.lock() {
            Ok(stack) => stack.clone(),
            Err(_) => vec![],
        }
    }
}
