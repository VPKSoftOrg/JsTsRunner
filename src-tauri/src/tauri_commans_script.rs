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

use tauri::State;

use crate::{
    js_helpers::{
        clear_log_stack, get_log_stack, js_console_error_capture, js_console_log_capture,
        js_console_warn_capture,
    },
    tauri_commands::TauriCommands,
    types::AppState,
};

impl TauriCommands {
    /// Runs the script passed from the frontend.
    ///
    /// # Arguments
    /// `code` - The script code to run.
    /// `app_state` - The Tauri application state.
    ///
    /// # Returns
    /// The result of the script run.
    pub async fn run_script(
        code: String,
        app_state: State<'_, AppState>,
    ) -> Result<String, String> {
        clear_log_stack();

        match app_state.log_stack.lock() {
            Ok(mut stack) => {
                *stack = vec![];
            }
            Err(_) => {}
        }

        let mut code = code.clone();
        // The console.log(), console.warn(), and console.error() functions are not
        // outputted anywhere, so we need to replace them with our own functions.
        code = code
            .replace("console.log(", "console_log(")
            .replace("console.warn(", "console_warn(")
            .replace("console.error(", "console_error(");
        let code = code.as_str();

        let isolate = &mut v8::Isolate::new(Default::default());

        let scope = &mut v8::HandleScope::new(isolate);
        let context = v8::Context::new(scope);
        let scope = &mut v8::ContextScope::new(scope, context);

        let object_template = v8::ObjectTemplate::new(scope);

        // Bind the console.log() function to a custom capture function which will update the data into the Tauri application state.
        let function_template = v8::FunctionTemplate::new(scope, js_console_log_capture);
        let name = v8::String::new(scope, "console_log").unwrap();
        object_template.set(name.into(), function_template.into());
        // Bind the console.warn() function to a custom capture function which will update the data into the Tauri application state.
        let function_template = v8::FunctionTemplate::new(scope, js_console_warn_capture);
        let name = v8::String::new(scope, "console_warn").unwrap();
        object_template.set(name.into(), function_template.into());
        // Bind the console.error() function to a custom capture function which will update the data into the Tauri application state.
        let function_template = v8::FunctionTemplate::new(scope, js_console_error_capture);
        let name = v8::String::new(scope, "console_error").unwrap();
        object_template.set(name.into(), function_template.into());

        let context = v8::Context::new_from_template(scope, object_template);

        let scope = &mut v8::ContextScope::new(scope, context);

        let source = match v8::String::new(scope, code) {
            Some(source) => source,
            None => {
                return Err("Failed to create script.".to_string());
            }
        };

        let script = match v8::Script::compile(scope, source, None) {
            Some(script) => script,
            None => {
                return Err("Failed to compile script.".to_string());
            }
        };

        let result = match script.run(scope) {
            Some(result) => result,
            None => {
                return Err("Failed to run script.".to_string());
            }
        };

        let result = match result.to_string(scope) {
            Some(result) => result.to_rust_string_lossy(scope),
            None => "Failed to convert compiled script and results to string.".to_string(),
        };

        match app_state.log_stack.lock() {
            Ok(mut stack) => *stack = get_log_stack(),
            Err(_) => {}
        }

        Ok(result)
    }
}
