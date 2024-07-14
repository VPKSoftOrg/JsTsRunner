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

use std::path::Path;

use chrono::{DateTime, Utc};
use tauri::State;

use crate::{
    config::get_file_state, tauri_commands::TauriCommands, types::AppState,
    utils::first_missing_in_sequence,
};

impl TauriCommands {
    /// Loads the file state requested by the frontend.
    ///
    /// # Arguments
    /// `app_state` - The Tauri application state.
    ///
    /// # Returns
    /// `true` if the file state was loaded successfully; Error otherwise.
    pub async fn load_file_state(app_state: &State<'_, AppState>) -> Result<bool, String> {
        let mut state = match get_file_state() {
            Ok(v) => v,
            Err(e) => {
                return Err(e);
            }
        };

        match app_state.active_tab_id.lock() {
            Ok(mut uid) => {
                *uid = state.active_tab_id;
            }
            Err(e) => {
                return Err(e.to_string());
            }
        }

        match app_state.file_ids.lock() {
            Ok(mut ids) => {
                *ids = state.file_ids;
            }
            Err(e) => {
                return Err(e.to_string());
            }
        }

        state.files.iter_mut().for_each(|f| {
            if f.file_name_path.is_some() {
                let path = Path::new(f.file_name_path.as_ref().unwrap());

                let last_modified: Option<DateTime<Utc>> = match path.metadata() {
                    Ok(metadata) => match metadata.modified() {
                        Ok(modified) => Some(modified.into()),
                        Err(_) => None,
                    },
                    Err(_) => None,
                };

                f.modified_at = last_modified;
            }
        });

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

    /// Gets the new tab unique id from the application state.
    ///
    /// # Arguments
    /// `app_state` - The Tauri application state.
    ///
    /// # Returns
    /// The new tab unique id.
    pub async fn get_new_tab_id(app_state: &State<'_, AppState>) -> Result<i32, String> {
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
}
