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
use tokio::{
    fs::{self, File},
    io::AsyncWriteExt,
};

use crate::{
    tauri_commands::TauriCommands,
    types::{AppState, FileTabData},
    utils::{first_missing_in_sequence, get_file_contents_and_modified_at},
};

impl TauriCommands {
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
    pub async fn is_file_changed_in_fs(
        data: FileTabData,
        app_state: &State<'_, AppState>,
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
                        modified_at_state: tab.modified_at_state.clone(),
                        evalueate_per_line: tab.evalueate_per_line,
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
        if tab.modified_at.is_none() || tab.file_name_path.is_none() {
            return Ok(false);
        }

        // Skip non-existing file in this function.
        let path = tab.file_name_path.clone().unwrap();
        let path = path.as_str();
        let path = Path::new(path);
        match Path::try_exists(path) {
            Ok(exists) => {
                if (!exists) {
                    return Ok(false);
                }
            }
            Err(e) => {
                return Ok(false);
            }
        };

        let meta_data = match fs::metadata(tab.file_name_path.clone().unwrap()).await {
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

        // Whatever the file content load question was answered, the file's timestamp is updated.
        match app_state.file_tabs.lock() {
            Ok(mut tabs) => {
                let tab = tabs.iter_mut().find(|tab| tab.uid == data.uid);

                match tab {
                    Some(tab) => {
                        tab.modified_at = modified_at;
                    }
                    None => {
                        return Err("Failed to find the file in application state.".to_string());
                    }
                }
            }
            Err(e) => {
                return Err(e.to_string());
            }
        }

        Ok(modified_at != tab.modified_at)
    }

    /// Checks if the file in the application state is missing in the file system.
    ///
    /// # Arguments
    /// `data` - The file data to check.
    /// `app_state` - The Tauri application state.
    ///
    /// # Returns
    /// `true` if the file is missing in the file system; `false` otherwise;
    ///
    /// Error if the file was not found in the application state or an internal error occurred.
    pub async fn is_existing_file_missing_in_fs(
        data: FileTabData,
        app_state: &State<'_, AppState>,
    ) -> Result<bool, String> {
        let tab = match app_state.file_tabs.lock() {
            Ok(tabs) => {
                let tab = tabs.iter().find(|tab| tab.uid == data.uid);
                match tab {
                    Some(tab) => FileTabData {
                        uid: tab.uid,
                        path: tab.path.clone(),
                        file_name: tab.file_name.clone(),
                        is_temporary: tab.is_temporary,
                        script_language: tab.script_language.clone(),
                        content: None,
                        modified_at: tab.modified_at.clone(),
                        file_name_path: tab.file_name_path.clone(),
                        modified_at_state: tab.modified_at_state.clone(),
                        evalueate_per_line: tab.evalueate_per_line,
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

        let path = tab.file_name_path.clone().unwrap();
        let path = path.as_str();
        let path = Path::new(path);

        let exists = match Path::try_exists(path) {
            Ok(exists) => exists,
            Err(e) => {
                return Err(e.to_string());
            }
        };

        if !tab.is_temporary && tab.file_name_path.is_some() && !exists {
            return Ok(true);
        } else {
            return Ok(false);
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
    pub async fn open_existing_file(
        file_name: String,
        app_state: &State<'_, AppState>,
    ) -> Result<bool, String> {
        let meta_data = fs::metadata(file_name.clone()).await;

        let modified_at = match meta_data {
            Ok(meta_data) => {
                if meta_data.len() > 10000000 {
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
                    modified_at_state: modified_at,
                    evalueate_per_line: false,
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

    /// Reloads the file contents in the application state.
    ///
    /// # Arguments
    /// `data` - The data of the file to reload.
    /// `app_state` - The Tauri application state.
    ///
    /// # Returns
    /// `true` if the file was reloaded successfully; Error otherwise.
    pub async fn reload_file_contents(
        data: FileTabData,
        app_state: &State<'_, AppState>,
    ) -> Result<bool, String> {
        let file_name_path = match app_state.file_tabs.lock() {
            Ok(mut tabs) => {
                let tab = tabs.iter_mut().find(|tab| tab.uid == data.uid);

                match tab {
                    Some(tab) => {
                        // Temporary files cannot be reloaded
                        if tab.is_temporary {
                            return Ok(false);
                        }

                        let file_name_path = match &tab.file_name_path {
                            Some(file_name_path) => file_name_path.clone(),

                            None => {
                                return Err("The file name and path is not specified.".to_string());
                            }
                        };

                        file_name_path
                    }
                    None => {
                        return Err("Failed to find the file in application state.".to_string());
                    }
                }
            }
            Err(e) => {
                return Err(e.to_string());
            }
        };

        let data_file = match get_file_contents_and_modified_at(file_name_path.as_str()).await {
            Ok(data) => data,
            Err(e) => {
                return Err(e.to_string());
            }
        };

        match app_state.file_tabs.lock() {
            Ok(mut tabs) => {
                let tab = tabs.iter_mut().find(|tab| tab.uid == data.uid);
                match tab {
                    Some(tab) => {
                        tab.content = Some(data_file.0);
                        tab.modified_at = data_file.1;
                        tab.modified_at_state = data_file.1;
                    }
                    None => return Err("Failed to find the file in application state.".to_string()),
                }
            }
            Err(e) => {
                return Err(e.to_string());
            }
        }
        Ok(true)
    }

    pub async fn set_current_file_keep_in_editor(
        data: FileTabData,
        app_state: &State<'_, AppState>,
    ) -> Result<bool, String> {
        match app_state.file_tabs.lock() {
            Ok(mut tabs) => {
                let tab = tabs.iter_mut().find(|tab| tab.uid == data.uid);

                match tab {
                    Some(tab) => {
                        tab.is_temporary = true;
                        tab.modified_at = None;
                        tab.modified_at_state = Some(Utc::now());
                    }
                    None => {
                        return Err("Failed to find the file in application state.".to_string());
                    }
                }
            }
            Err(e) => {
                return Err(e.to_string());
            }
        };

        Ok(true)
    }

    /// Saves the file contents in the application state and into the file system.
    ///
    /// # Arguments
    /// `data` - The data of the file to save.
    /// `file_name_path` - The path of the file to save.
    /// `app_state` - The Tauri application state.
    ///
    /// # Returns
    /// `true` if the file was saved successfully; Error otherwise.
    pub async fn save_file_contents(
        data: FileTabData,
        file_name_path: Option<String>,
        app_state: &State<'_, AppState>,
    ) -> Result<bool, String> {
        // Get the matching file data from the application state.
        let mut existing_data = match app_state.file_tabs.lock() {
            Ok(mut tabs) => {
                let tab = tabs.iter_mut().find(|tab| tab.uid == data.uid);
                match tab {
                    Some(tab) => tab.clone(),
                    None => {
                        return Err("Failed to find the file in application state.".to_string());
                    }
                }
            }
            Err(e) => {
                return Err(e.to_string());
            }
        };

        // If saving an existing file the file should exist.
        if existing_data.file_name_path.is_some() && !existing_data.is_temporary {
            let path = existing_data.file_name_path.clone().unwrap();
            let path = path.as_str();
            let path = Path::new(path);
            match Path::try_exists(path) {
                Ok(exists) => {
                    if !exists {
                        return Err("The file does not exist.".to_string());
                    }
                }
                Err(e) => {
                    return Err(e.to_string());
                }
            }
        }

        // Verify that the file name and path are specified.
        if file_name_path.is_none() && existing_data.file_name_path.is_none() {
            return Err("The file name and path is not specified.".to_string());
        }

        // Determine the file name and path to save the contents into.
        let file_name_path = match file_name_path {
            Some(file_name_path) => file_name_path,
            None => match &existing_data.file_name_path {
                Some(file_name_path) => file_name_path.clone(),
                None => {
                    return Err("The file name and path is not specified.".to_string());
                }
            },
        };

        // Get the file contents to be saved.
        let file_contents = match data.content {
            Some(file_contents) => file_contents,
            None => {
                return Err("The file content is not specified.".to_string());
            }
        };

        let file_bytes = file_contents.as_bytes();

        // Save the file contents to the file path overriding any existing contents.
        match File::create(file_name_path.clone()).await {
            Ok(mut file) => match file.write_all(file_bytes).await {
                Ok(_) => {
                    existing_data.content = Some(file_contents);
                    existing_data.is_temporary = false;
                    existing_data.file_name_path = Some(file_name_path.clone());
                }
                Err(e) => {
                    return Err(e.to_string());
                }
            },
            Err(e) => {
                return Err(e.to_string());
            }
        }

        let meta_data = match fs::metadata(existing_data.file_name_path.clone().unwrap()).await {
            Ok(meta_data) => meta_data,
            Err(e) => {
                return Err(e.to_string());
            }
        };

        existing_data.modified_at = match meta_data.modified() {
            Ok(modified_at) => Some(modified_at.into()),
            Err(_) => None,
        };

        let path = Path::new(file_name_path.as_str());

        // The following should be safe to unwrap() as the None options
        // shouldn't occur in case of file name being in format of path/file_name.[ts/js]
        let extension = path.extension().unwrap().to_str().unwrap().to_string();
        let file_name = path.file_name().unwrap().to_str().unwrap().to_string();
        let path = path.parent().unwrap().to_str().unwrap().to_string();

        existing_data.file_name = file_name;
        existing_data.path = Some(path);
        existing_data.script_language = if extension == "js" {
            "javascript"
        } else {
            "typescript"
        }
        .to_string();

        existing_data.modified_at_state = existing_data.modified_at.clone();

        // Update the file data in the application state.
        match app_state.file_tabs.lock() {
            Ok(mut tabs) => {
                let tab = tabs.iter_mut().find(|tab| tab.uid == data.uid);
                match tab {
                    Some(tab) => {
                        *tab = existing_data;
                    }
                    None => return Err("Failed to find the file in application state.".to_string()),
                }
            }
            Err(e) => {
                return Err(e.to_string());
            }
        }

        Ok(true)
    }
}
