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
        }
    }
}

impl AppConfig {
    pub fn error(error: String) -> Self {
        Self {
            error: true,
            error_message: error,
            ..Default::default()
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct FileState {
    pub files: Vec<FileTabData>,
    pub file_index: u64,
}

impl ::std::default::Default for FileState {
    fn default() -> Self {
        Self {
            files: vec![],
            file_index: 0,
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
            return AppConfig::error(e.to_string());
        }
    };

    result
}

/// Gets the file state from a file or default if one doesn't exist.
///
/// # Returns
/// A FileState value
pub fn get_file_state() -> Result<FileState, String> {
    let result = match confy::load("js_ts_runner", "state") {
        Ok(v) => Ok(v),
        Err(e) => Err(e.to_string()),
    };

    result
}

/// Saves the file state to a settings file using confy. The file format is TOML.
/// # Arguments
///
/// * `file_state` - the file state value.
///
/// # Returns
/// `true` if the file state was successfully saved; Error otherwise.
pub fn save_file_state(file_state: FileState) -> Result<bool, String> {
    let result = match confy::store("js_ts_runner", "state", file_state) {
        Ok(_) => Ok(true),
        Err(e) => {
            return Err(e.to_string());
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
