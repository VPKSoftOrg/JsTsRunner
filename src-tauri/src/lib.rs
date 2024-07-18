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

use config::AppConfig;

use tauri::State;
use tauri_commands::TauriCommands;
use types::{AppState, AppStateResult, FileTabData};
use utils::show_window;
use v8;

#[macro_use]
extern crate rust_i18n;
i18n!();

mod config;
mod js_helpers;
mod tauri_commands;
mod tauri_commands_config;
mod tauri_commands_fs;
mod tauri_commands_state;
mod tauri_commands_tabs;
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
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = show_window(app);
        }))
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            load_settings,
            set_i18n_locale,
            save_settings,
            get_app_state,
            run_script,
            run_script_line_by_line,
            save_open_tabs,
            add_new_tab,
            update_open_tabs,
            load_file_state,
            get_new_tab_id,
            open_existing_file,
            is_file_changed_in_fs,
            is_existing_file_missing_in_fs,
            reload_file_contents,
            set_current_file_keep_in_editor,
            save_file_contents,
            test_function_call,
            set_active_tab_id
        ])
        .run(tauri::generate_context!())
        .expect(t!("messages.tauriRunError").into_owned().as_str());
}

/// See [TauriCommands::load_settings]
#[tauri::command(async)]
async fn load_settings() -> Result<AppConfig, String> {
    TauriCommands::load_settings().await
}

/// Sets the locale from application settings for the i18n.
///
/// # Returns
///
/// true if the locale was set successfully; Error otherwise.
#[tauri::command(async)]
async fn set_i18n_locale() -> Result<bool, String> {
    let config = TauriCommands::load_settings().await;
    match config {
        Ok(settings) => {
            rust_i18n::set_locale(&settings.locale);
        }
        Err(error) => {
            return Err(error);
        }
    }

    Ok(true)
}

/// See [TauriCommands::load_file_state]
#[tauri::command(async)]
async fn load_file_state(app_state: State<'_, AppState>) -> Result<bool, String> {
    TauriCommands::load_file_state(&app_state).await
}

/// See [TauriCommands::save_settings]
#[tauri::command(async)]
async fn save_settings(config: AppConfig) -> bool {
    TauriCommands::save_settings(config).await
}

/// See [TauriCommands::run_script]
#[tauri::command(async)]
async fn run_script(code: String, app_state: State<'_, AppState>) -> Result<String, String> {
    TauriCommands::run_script(code, &app_state).await
}

/// See [TauriCommands::run_script_line_by_line]
#[tauri::command(async)]
async fn run_script_line_by_line(
    code: Vec<String>,
    app_state: State<'_, AppState>,
) -> Result<Vec<String>, String> {
    TauriCommands::run_script_line_by_line(code, &app_state).await
}

/// See [TauriCommands::save_open_tabs]
#[tauri::command(async)]
async fn save_open_tabs(app_state: State<'_, AppState>) -> Result<bool, String> {
    TauriCommands::save_open_tabs(&app_state).await
}

/// See [TauriCommands::update_open_tabs]
#[tauri::command(async)]
async fn update_open_tabs(
    tab_data: Vec<FileTabData>,
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    TauriCommands::update_open_tabs(tab_data, &app_state).await
}

/// See [TauriCommands::get_new_tab_id]
#[tauri::command(async)]
async fn get_new_tab_id(app_state: State<'_, AppState>) -> Result<i32, String> {
    TauriCommands::get_new_tab_id(&app_state).await
}

/// See [TauriCommands::add_new_tab]
#[tauri::command(async)]
async fn add_new_tab(
    tab_data: FileTabData,
    tab_content: Option<String>,
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    TauriCommands::add_new_tab(tab_data, tab_content, &app_state).await
}

/// See [TauriCommands::get_app_state]
#[tauri::command(async)]
async fn get_app_state(app_state: State<'_, AppState>) -> Result<AppStateResult, String> {
    TauriCommands::get_app_state(&app_state).await
}

/// See [TauriCommands::open_existing_file]
#[tauri::command(async)]
async fn open_existing_file(
    file_name: String,
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    TauriCommands::open_existing_file(file_name, &app_state).await
}

/// See [TauriCommands::is_file_changed_in_fs]
#[tauri::command(async)]
async fn is_file_changed_in_fs(
    data: FileTabData,
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    TauriCommands::is_file_changed_in_fs(data, &app_state).await
}

/// See [TauriCommands::is_existing_file_missing_in_fs]
#[tauri::command(async)]
async fn is_existing_file_missing_in_fs(
    data: FileTabData,
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    TauriCommands::is_existing_file_missing_in_fs(data, &app_state).await
}

/// See [TauriCommands::reload_file_contents]
#[tauri::command(async)]
async fn reload_file_contents(
    data: FileTabData,
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    TauriCommands::reload_file_contents(data, &app_state).await
}

/// See [TauriCommands::set_current_file_keep_in_editor]
#[tauri::command(async)]
async fn set_current_file_keep_in_editor(
    data: FileTabData,
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    TauriCommands::set_current_file_keep_in_editor(data, &app_state).await
}

/// See [TauriCommands::save_file_contents]
#[tauri::command(async)]
async fn save_file_contents(
    data: FileTabData,
    file_name_path: Option<String>,
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    TauriCommands::save_file_contents(data, file_name_path, &app_state).await
}

/// See [TauriCommands::set_active_tab_id]
#[tauri::command(async)]
async fn set_active_tab_id(tab_id: i32, app_state: State<'_, AppState>) -> Result<bool, String> {
    TauriCommands::set_active_tab_id(tab_id, &app_state).await
}

/// A test function call for debugging and testing purposes.
///
/// # Arguments
///
/// * `app_state` - The application state.
///
/// # Returns
///
/// * `Result<Vec<String>, String>` - The result of the test function call.
#[tauri::command(async)]
async fn test_function_call(_app_state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let result: Vec<String> = vec![];
    Ok(result)
}
