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

use tauri::State;
use tauri_commands::TauriCommands;
use types::{AppState, AppStateResult, FileTabData};
use utils::first_missing_in_sequence;
use v8;

mod config;
mod js_helpers;
mod tauri_commands;
mod tauri_commands_fs;
mod tauri_commans_script;
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
            is_file_changed_in_fs,
            reload_file_contents
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

/// See [`Result<String, String>`](TauriCommands::run_script)
#[tauri::command]
async fn run_script(code: String, app_state: State<'_, AppState>) -> Result<String, String> {
    TauriCommands::run_script(code, app_state).await
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

/// See [`Result<bool, String>`](TauriCommands::open_existing_file)
#[tauri::command]
async fn open_existing_file(
    file_name: String,
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    TauriCommands::open_existing_file(file_name, app_state).await
}

/// See [`Result<bool, String>`](TauriCommands::is_file_changed_in_fs)
#[tauri::command]
async fn is_file_changed_in_fs(
    data: FileTabData,
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    TauriCommands::is_file_changed_in_fs(data, app_state).await
}

/// See [`Result<bool, String>`](TauriCommands::reload_file_contents)
#[tauri::command]
async fn reload_file_contents(
    data: FileTabData,
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    TauriCommands::reload_file_contents(data, app_state).await
}
