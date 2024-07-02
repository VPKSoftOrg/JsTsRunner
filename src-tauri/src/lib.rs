use config::{get_app_config, set_app_config, AppConfig};
use v8;

mod config;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

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
        .invoke_handler(tauri::generate_handler![
            greet,
            load_settings,
            save_settings,
            run_script
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Loads the application settings requested by the frontend.
///
/// # Returns
/// Application settings.
#[tauri::command]
async fn load_settings() -> AppConfig {
    get_app_config()
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
async fn run_script(code: String) -> String {
    let isolate = &mut v8::Isolate::new(Default::default());

    let scope = &mut v8::HandleScope::new(isolate);
    let context = v8::Context::new(scope);
    let scope = &mut v8::ContextScope::new(scope, context);

    let code = v8::String::new(scope, code.as_str()).unwrap();
    let script = match v8::Script::compile(scope, code, None) {
        Some(script) => script,
        None => {
            return "Error: Failed to compile script.".to_string();
        }
    };

    let result = match script.run(scope) {
        Some(result) => result,
        None => {
            return "Error: Failed to run script.".to_string();
        }
    };

    let result = result.to_string(scope).unwrap();

    match result.to_string(scope) {
        Some(result) => result.to_rust_string_lossy(scope),
        None => "Error: Failed to convert compiled script and results to string.".to_string(),
    }
}
