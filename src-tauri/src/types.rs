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

use std::sync::Mutex;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// The application state for the Tauri application.
pub struct AppState {
    /// The log stack for the run script.
    pub log_stack: Mutex<Vec<String>>,
    /// The index of the next file.
    pub file_ids: Mutex<Vec<i32>>,
    /// The file tabs currently open.
    pub file_tabs: Mutex<Vec<FileTabData>>,
}

/// The application default state for the Tauri application.
impl ::std::default::Default for AppState {
    fn default() -> Self {
        Self {
            log_stack: Mutex::new(vec![]),
            file_ids: Mutex::new(vec![]),
            file_tabs: Mutex::new(vec![]),
        }
    }
}

/// The application state serializable result data.
#[derive(Serialize, Deserialize)]
pub struct AppStateResult {
    /// The log stack for the run script.
    pub log_stack: Vec<String>,
    /// The index of the next file.
    pub file_ids: Vec<i32>,
    /// The file tabs currently open.
    pub file_tabs: Vec<FileTabData>,
}

/// The file tab data for a single file.
#[derive(Serialize, Deserialize, Clone)]
pub struct FileTabData {
    /// The unique id of the file.
    pub uid: i32,
    /// The path of the file.
    pub path: Option<String>,
    /// The name of the file.
    pub file_name: String,
    /// The name and path of the file.
    pub file_name_path: Option<String>,
    /// A flag indicating if the file is temporary.
    pub is_temporary: bool,
    /// The language of the script.
    pub script_language: String,
    /// The optional content of the file. The content can be in the file system also if the file is not temporary.
    pub content: Option<String>,
    /// The last modified date of the file.
    pub modified_at: Option<DateTime<Utc>>,
    /// A flag indicating if the file differs from the file system.
    pub modified_at_state: Option<DateTime<Utc>>,
}
