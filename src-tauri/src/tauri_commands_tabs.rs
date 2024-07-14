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
    config::{save_file_state, FileState},
    tauri_commands::TauriCommands,
    types::{AppState, AppStateResult, FileTabData},
    utils::first_missing_in_sequence,
};

impl TauriCommands {
    /// Saves the open tabs from the application state to a separate config file.
    ///
    /// # Arguments
    /// `app_state` - The Tauri application state.
    ///
    /// # Returns
    /// `true` if the open tabs were saved successfully; Error otherwise.
    pub async fn save_open_tabs(app_state: &State<'_, AppState>) -> Result<bool, String> {
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

        match app_state.active_tab_id.lock() {
            Ok(id) => {
                config.active_tab_id = *id;
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
    pub async fn update_open_tabs(
        tab_data: Vec<FileTabData>,
        app_state: &State<'_, AppState>,
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

        match TauriCommands::save_open_tabs(app_state).await {
            Ok(_) => {
                return Ok(true);
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
    pub async fn add_new_tab(
        tab_data: FileTabData,
        app_state: &State<'_, AppState>,
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
    pub async fn get_app_state(app_state: &State<'_, AppState>) -> Result<AppStateResult, String> {
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

        let log_stack_lines = match app_state.log_stack_lines.lock() {
            Ok(lines) => {
                let log_stack_lines = lines.clone();
                log_stack_lines
            }
            Err(_) => {
                return Err("Error: Failed to get application state.".to_string());
            }
        };

        let active_tab_id = match app_state.active_tab_id.lock() {
            Ok(id) => {
                let active_tab_id = id.clone();
                active_tab_id
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
                    log_stack_lines,
                    active_tab_id,
                });
            }
            Err(_) => {
                return Err("Error: Failed to get application state.".to_string());
            }
        }
    }
}
