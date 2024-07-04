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

use serde::{Deserialize, Serialize};

/// The application state for the Tauri application.
pub struct AppState {
    pub log_stack: Mutex<Vec<String>>,
    pub file_index: Mutex<u64>,
    pub file_tabs: Mutex<Vec<FileTabData>>,
}

/// The application default state for the Tauri application.
impl ::std::default::Default for AppState {
    fn default() -> Self {
        Self {
            log_stack: Mutex::new(vec![]),
            file_index: Mutex::new(0),
            file_tabs: Mutex::new(vec![]),
        }
    }
}

/// The application state seriazable result data.
#[derive(Serialize, Deserialize)]
pub struct AppStateResult {
    pub log_stack: Vec<String>,
    pub file_index: u64,
    pub file_tabs: Vec<FileTabData>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct FileTabData {
    pub index: u64,
    pub path: Option<String>,
    pub file_name: String,
    pub is_temporary: bool,
    pub script_language: String,
    pub content: Option<String>,
}
