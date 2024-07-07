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

use std::{os::windows::fs::MetadataExt, path::Path};

use chrono::{DateTime, Utc};
use config::{
    get_app_config, get_file_state, save_file_state, set_app_config, AppConfig, FileState,
};
use js_helpers::{
    clear_log_stack, get_log_stack, js_console_error_capture, js_console_log_capture,
    js_console_warn_capture,
};
use tauri::State;
use tokio::fs;
use types::{AppState, AppStateResult, FileTabData};
use utils::first_missing_in_sequence;
use v8;

mod config;
mod js_helpers;
mod types;
mod utils;

#[tokio::main]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    let platform = v8::new_default_platform(0, false).make_shared();
    v8::V8::initialize_platform(platform);
    v8::V8::initialize();

    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
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
            get_new_tab_id,
            open_existing_file,
            is_file_changed_in_fs
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

/// Loads the file state requested by the frontend.
///
/// # Arguments
/// `app_state` - The Tauri application state.
///
/// # Returns
/// `true` if the file state was loaded successfully; Error otherwise.
#[tauri::command]
async fn load_file_state(app_state: State<'_, AppState>) -> Result<bool, String> {
    let state = match get_file_state() {
        Ok(v) => v,
        Err(e) => {
            return Err(e);
        }
    };

    match app_state.file_ids.lock() {
        Ok(mut ids) => {
            *ids = state.file_ids;
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
/// `config` - the application configuration.
///
/// # Returns
/// `true` if the settings were saved successfully; `false` otherwise.
#[tauri::command]
async fn save_settings(config: AppConfig) -> bool {
    set_app_config(config)
}

/// Runs the script passed from the frontend.
///
/// # Arguments
/// `code` - The script code to run.
/// `app_state` - The Tauri application state.
///
/// # Returns
/// The result of the script run.
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

/// Saves the open tabs from the application state to a separate config file.
///
/// # Arguments
/// `app_state` - The Tauri application state.
///
/// # Returns
/// `true` if the open tabs were saved successfully; Error otherwise.
#[tauri::command]
async fn save_open_tabs(app_state: State<'_, AppState>) -> Result<bool, String> {
    let mut config = FileState::default();

    match app_state.file_ids.lock() {
        Ok(ids) => {
            config.file_ids = ids.clone();
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

/// Updates the open tabs into the application state.
///
/// # Arguments
/// `tab_data` - The updated open tabs.
/// `app_state` - The Tauri application state.
///
/// # Returns
/// `true` if the open tabs were updated successfully; Error otherwise.
#[tauri::command]
async fn update_open_tabs(
    tab_data: Vec<FileTabData>,
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    let mut new_ids: Vec<i32> = vec![];

    for tab in &tab_data {
        new_ids.push(tab.uid);
    }

    match app_state.file_tabs.lock() {
        Ok(mut tabs) => {
            *tabs = tab_data;
        }
        Err(e) => {
            return Err(e.to_string());
        }
    }

    match app_state.file_ids.lock() {
        Ok(mut ids) => {
            *ids = new_ids;
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

/// Gets the new tab unique id from the application state.
///
/// # Arguments
/// `app_state` - The Tauri application state.
///
/// # Returns
/// The new tab unique id.
#[tauri::command]
async fn get_new_tab_id(app_state: State<'_, AppState>) -> Result<i32, String> {
    match app_state.file_ids.lock() {
        Ok(ids) => {
            let new_ids: Vec<i32> = ids.clone();
            let new_id = first_missing_in_sequence(&new_ids);
            return Ok(new_id);
        }
        Err(e) => {
            return Err(e.to_string());
        }
    }
}

/// Adds a new tab into the application state.
///
/// # Arguments
/// `tab_data` - The new tab data.
/// `app_state` - The Tauri application state.
///
/// # Returns
/// `true` if the new tab was added successfully; Error otherwise.
#[tauri::command]
async fn add_new_tab(
    tab_data: FileTabData,
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    let mut tab_data = tab_data;

    match app_state.file_ids.lock() {
        Ok(mut ids) => {
            let mut new_ids: Vec<i32> = ids.clone();

            let new_id = first_missing_in_sequence(&new_ids);
            new_ids.push(new_id);
            *ids = new_ids;
            tab_data.uid = new_id;
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

/// Returns the open tabs from the application state.
///
/// # Arguments
/// `app_state` - The Tauri application state.
///
/// # Returns
/// `Vec<FileTabData>` if the open tabs were returned successfully; Error otherwise.
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

    let file_ids = match app_state.file_ids.lock() {
        Ok(ids) => {
            let file_ids = ids.clone();
            file_ids
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
                file_ids,
            });
        }
        Err(_) => {
            return Err("Error: Failed to get application state.".to_string());
        }
    }
}

/// Opens an existing file in the application state.
///
/// # Arguments
/// `file_name` - The name of the file to open.
/// `app_state` - The Tauri application state.
///
/// # Returns
/// `true` if the file was opened successfully; Error otherwise.
#[tauri::command]
async fn open_existing_file(
    file_name: String,
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    let meta_data = fs::metadata(file_name.clone()).await;

    let modified_at = match meta_data {
        Ok(meta_data) => {
            if meta_data.file_size() > 10000000 {
                // Limit the file size to 10 MB
                panic!("File is too large. The [hard-coded] limit is 10 MB.");
            }

            match meta_data.modified() {
                Ok(modified_at) => Some(modified_at),
                // Return none if the file has no last modified date. This is mentioned in the documentation of `std::fs::Metadata::modified()`.
                Err(_) => None,
            }
        }
        Err(e) => {
            return Err(e.to_string());
        }
    };

    let modified_at: Option<DateTime<Utc>> = match modified_at {
        Some(modified_at) => Some(modified_at.into()),
        None => None,
    };

    let contents = fs::read_to_string(file_name.clone()).await;

    let mut tab_data = match contents {
        Ok(contents) => {
            let path = Path::new(&file_name);
            let file_name_path = file_name.clone();

            // The following should be safe to unwrap() as the None options
            // shouldn't occur in case of file name being in format of path/file_name.[ts/js]
            let extension = path.extension().unwrap().to_str().unwrap().to_string();
            let file_name = path.file_name().unwrap().to_str().unwrap().to_string();
            let path = path.parent().unwrap().to_str().unwrap().to_string();

            let tab_data = FileTabData {
                uid: 0,
                path: Some(path),
                file_name: file_name,
                is_temporary: false,
                script_language: if extension == "js" {
                    "javascript"
                } else {
                    "typescript"
                }
                .to_string(),
                content: Some(contents),
                modified_at: modified_at,
                file_name_path: Some(file_name_path),
            };
            tab_data
        }
        Err(e) => {
            return Err(e.to_string());
        }
    };

    match app_state.file_ids.lock() {
        Ok(mut ids) => {
            let mut new_ids: Vec<i32> = ids.clone();

            let new_id = first_missing_in_sequence(&new_ids);
            new_ids.push(new_id);
            *ids = new_ids;
            tab_data.uid = new_id;
        }
        Err(e) => {
            return Err(e.to_string());
        }
    }

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

/// Checks if the file in the application state has changed in the file system.
///
/// # Arguments
/// `data` - The file data to check.
/// `app_state` - The Tauri application state.
///
/// # Returns
/// `true` if the file has changed in the file system; `false` otherwise;
///
/// Error if the file was not found in the application state or an internal error occurred.
#[tauri::command]
async fn is_file_changed_in_fs(
    data: FileTabData,
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    let tab = match app_state.file_tabs.lock() {
        Ok(tabs) => {
            let tab = tabs.iter().find(|tab| tab.uid == data.uid);

            match tab {
                // Do a light copy dropping the contents of the file.
                // The MutexGuard prevents from returning the protected data out of the code block.
                Some(tab) => FileTabData {
                    uid: tab.uid,
                    path: tab.path.clone(),
                    file_name: tab.file_name.clone(),
                    is_temporary: tab.is_temporary,
                    script_language: tab.script_language.clone(),
                    content: None,
                    modified_at: tab.modified_at.clone(),
                    file_name_path: tab.file_name_path.clone(),
                },
                None => {
                    return Err("Failed to find the file in application state.".to_string());
                }
            }
        }
        Err(e) => {
            return Err(e.to_string());
        }
    };

    // Abort the check here if the file has no last modified date.
    if tab.modified_at.is_none() {
        return Ok(false);
    }

    let meta_data = match fs::metadata(tab.path.clone().unwrap()).await {
        Ok(meta_data) => meta_data,
        Err(e) => {
            return Err(e.to_string());
        }
    };

    // Abort the check here if the file has no last modified date. This is mentioned in the documentation of `std::fs::Metadata::modified()`.
    let modified_at = match meta_data.modified() {
        Ok(modified_at) => Some(modified_at),
        Err(_) => {
            return Ok(false);
        }
    };

    let modified_at: Option<DateTime<Utc>> = match modified_at {
        Some(modified_at) => Some(modified_at.into()),
        None => None,
    };

    Ok(modified_at != tab.modified_at)
}
