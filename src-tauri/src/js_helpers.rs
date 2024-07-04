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

static mut LOG_STACK: Mutex<Vec<String>> = Mutex::new(vec![]);

pub fn js_console_log_capture(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut _rv: v8::ReturnValue,
) {
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

    push_log_stack(format!("LOG: {}", result));
}

pub fn js_console_warn_capture(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut _rv: v8::ReturnValue,
) {
    let mut result: Vec<String> = Vec::new();
    for i in 0..args.length() {
        let arg = args
            .get(i)
            .to_string(scope)
            .unwrap()
            .to_rust_string_lossy(scope);
        result.push(arg);
    }

    let result = result.join(" ");

    push_log_stack(format!("WARN: {}", result));
}

pub fn js_console_error_capture(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut _rv: v8::ReturnValue,
) {
    let mut result: Vec<String> = Vec::new();
    for i in 0..args.length() {
        let arg = args
            .get(i)
            .to_string(scope)
            .unwrap()
            .to_rust_string_lossy(scope);
        result.push(arg);
    }

    let result = result.join(" ");

    push_log_stack(format!("ERROR: {}", result));
}

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

pub fn clear_log_stack() {
    unsafe {
        match LOG_STACK.lock() {
            Ok(mut stack) => {
                stack.clear();
            }
            Err(_) => {}
        }
    }
}

pub fn get_log_stack() -> Vec<String> {
    unsafe {
        match LOG_STACK.lock() {
            Ok(stack) => stack.clone(),
            Err(_) => vec![],
        }
    }
}
