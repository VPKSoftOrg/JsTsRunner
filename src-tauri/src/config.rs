use serde_derive::{Deserialize, Serialize};

use crate::types::FileTabData;

/// The software settings.
#[derive(Serialize, Deserialize)]
pub struct AppConfig {
    /// The current application locale used by the i18next library
    locale: String,
    /// A value indicating whether the plugin-window-state should be used to remember the previous window state.
    save_window_state: bool,
    /// A value indicating whether to use dark mode with the application.
    dark_mode: bool,
    /// A value indicating whether a load error occurred.
    error: bool,
    /// An error message if one occurred.
    error_message: String,
    /// The list of open files from the Tauri application state.
    pub files: Vec<FileTabData>,
    /// The id of the previous file.
    pub previous_file_id: u64,
}

// The default value for the application configuration.
impl ::std::default::Default for AppConfig {
    fn default() -> Self {
        Self {
            locale: "en".to_string(),
            save_window_state: false,
            error: false,
            error_message: "".to_string(),
            dark_mode: false,
            files: vec![],
            previous_file_id: 0,
        }
    }
}

/// Gets the application config from a file or default if one doesn't exist.
///
/// # Returns
/// An AppConfig value
pub fn get_app_config() -> AppConfig {
    let result = match confy::load("js_ts_runner", None) {
        Ok(v) => v,
        Err(e) => {
            let result = AppConfig {
                error_message: e.to_string(),
                error: true,
                locale: "en".to_string(),
                save_window_state: false,
                dark_mode: false,
                files: vec![],
                previous_file_id: 0,
            };
            result
        }
    };

    result
}

/// Saves the application config to a settings file using confy. The file format is TOML.
/// # Arguments
///
/// * `config` - the application configuration value.
///
/// # Returns
/// `true` if the config was successfully saved; `false` otherwise.
pub fn set_app_config(config: AppConfig) -> bool {
    let result = match confy::store("js_ts_runner", None, config) {
        Ok(_) => true,
        Err(_) => false,
    };

    result
}
