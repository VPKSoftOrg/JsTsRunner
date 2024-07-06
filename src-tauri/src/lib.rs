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

use config::{
    get_app_config, get_file_state, save_file_state, set_app_config, AppConfig, FileState,
};
use js_helpers::{
    clear_log_stack, get_log_stack, js_console_error_capture, js_console_log_capture,
    js_console_warn_capture,
};
use tauri::State;
use types::{AppState, AppStateResult, FileTabData};
use v8;

mod config;
mod js_helpers;
mod types;

#[tokio::main]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    v8_init();

    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::default().build())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            load_settings,
            save_settings,
            get_app_state,
            run_script,
            save_open_tabs,
            add_new_tab,
            update_open_tabs,
            load_file_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Loads the application settings requested by the frontend.
///
/// # Returns
/// Application settings.
#[tauri::command]
async fn load_settings() -> Result<AppConfig, String> {
    let config = get_app_config();
    Ok(config)
}

#[tauri::command]
async fn load_file_state(app_state: State<'_, AppState>) -> Result<bool, String> {
    let state = match get_file_state() {
        Ok(v) => v,
        Err(e) => {
            return Err(e);
        }
    };

    match app_state.file_index.lock() {
        Ok(mut index) => {
            *index = state.file_index;
        }
        Err(e) => {
            return Err(e.to_string());
        }
    }

    match app_state.file_tabs.lock() {
        Ok(mut tabs) => {
            *tabs = state.files;
        }
        Err(e) => {
            return Err(e.to_string());
        }
    }

    Ok(true)
}

/// Saves the settings passed from the frontend.
///
/// # Arguments
///
/// `config` - the application configuration.
///
/// # Returns
/// `true` if the settings were saved successfully; `false` otherwise.
#[tauri::command]
async fn save_settings(config: AppConfig) -> bool {
    set_app_config(config)
}

#[tauri::command]
async fn run_script(code: String, app_state: State<'_, AppState>) -> Result<String, String> {
    clear_log_stack();

    match app_state.log_stack.lock() {
        Ok(mut stack) => {
            *stack = vec![];
        }
        Err(_) => {}
    }

    let mut code = code.clone();
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
    let function_template = v8::FunctionTemplate::new(scope, js_console_log_capture);
    let name = v8::String::new(scope, "console_log").unwrap();
    object_template.set(name.into(), function_template.into());
    let function_template = v8::FunctionTemplate::new(scope, js_console_warn_capture);
    let name = v8::String::new(scope, "console_warn").unwrap();
    object_template.set(name.into(), function_template.into());
    let function_template = v8::FunctionTemplate::new(scope, js_console_error_capture);
    let name = v8::String::new(scope, "console_error").unwrap();
    object_template.set(name.into(), function_template.into());

    let context = v8::Context::new_from_template(scope, object_template);

    let scope = &mut v8::ContextScope::new(scope, context);

    let source = match v8::String::new(scope, code) {
        Some(source) => source,
        None => {
            return Err("Error: Failed to compile script.".to_string());
        }
    };

    let script = match v8::Script::compile(scope, source, None) {
        Some(script) => script,
        None => {
            return Err("Error: Failed to compile script.".to_string());
        }
    };

    let result = match script.run(scope) {
        Some(result) => result,
        None => {
            return Err("Error: Failed to run script.".to_string());
        }
    };

    let result = match result.to_string(scope) {
        Some(result) => result.to_rust_string_lossy(scope),
        None => "Error: Failed to convert compiled script and results to string.".to_string(),
    };

    match app_state.log_stack.lock() {
        Ok(mut stack) => *stack = get_log_stack(),
        Err(_) => {}
    }

    Ok(result)
}

fn v8_init() {
    let platform = v8::new_default_platform(0, false).make_shared();
    v8::V8::initialize_platform(platform);
    v8::V8::initialize();
}

#[tauri::command]
async fn save_open_tabs(app_state: State<'_, AppState>) -> Result<bool, String> {
    let mut config = FileState::default();

    match app_state.file_index.lock() {
        Ok(index) => {
            config.file_index = *index;
        }
        Err(_) => {}
    }

    match app_state.file_tabs.lock() {
        Ok(tabs) => {
            config.files = tabs.clone();
        }
        Err(_) => {}
    }

    match save_file_state(config) {
        Ok(_) => {
            return Ok(true);
        }
        Err(e) => {
            return Err(e);
        }
    }
}

#[tauri::command]
async fn update_open_tabs(
    tab_data: Vec<FileTabData>,
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    match app_state.file_tabs.lock() {
        Ok(mut tabs) => {
            *tabs = tab_data;
        }
        Err(e) => {
            return Err(e.to_string());
        }
    }

    match save_open_tabs(app_state).await {
        Ok(_) => {
            return Ok(true);
        }
        Err(e) => {
            return Err(e.to_string());
        }
    }
}

#[tauri::command]
async fn add_new_tab(
    tab_data: FileTabData,
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    let mut tab_data = tab_data;

    match app_state.file_index.lock() {
        Ok(mut index) => {
            *index = *index + 1;
            tab_data.index = *index;
        }
        Err(e) => {
            return Err(e.to_string());
        }
    }

    tab_data.content = Some("".to_string());
    tab_data.path = None;
    tab_data.is_temporary = true;

    match app_state.file_tabs.lock() {
        Ok(mut tabs) => {
            tabs.push(tab_data);
        }
        Err(e) => {
            return Err(e.to_string());
        }
    }

    Ok(true)
}

#[tauri::command]
async fn get_app_state(app_state: State<'_, AppState>) -> Result<AppStateResult, String> {
    let file_tabs = match app_state.file_tabs.lock() {
        Ok(tabs) => {
            let file_tabs = tabs.clone();
            file_tabs
        }
        Err(_) => {
            return Err("Error: Failed to get application state.".to_string());
        }
    };

    let file_index = match app_state.file_index.lock() {
        Ok(index) => {
            let file_index = *index;
            file_index
        }
        Err(_) => {
            return Err("Error: Failed to get application state.".to_string());
        }
    };

    match app_state.log_stack.lock() {
        Ok(stack) => {
            let log_stack = stack.clone();
            return Ok(AppStateResult {
                log_stack,
                file_tabs,
                file_index,
            });
        }
        Err(_) => {
            return Err("Error: Failed to get application state.".to_string());
        }
    }
}
