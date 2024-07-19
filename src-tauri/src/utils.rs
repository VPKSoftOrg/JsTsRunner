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

use chrono::{DateTime, Utc};
use tauri::{AppHandle, Manager};
use tokio::fs;

pub fn first_missing_in_sequence(vec: &Vec<i32>) -> i32 {
    // Dont' iterate entire i32 positive range if there is nothing to check for.
    if vec.len() == 0 {
        return 1;
    }

    for i in 1..i32::MAX {
        if !vec.contains(&i) {
            return i;
        }
    }
    1
}

pub async fn get_file_contents_and_modified_at(
    path: &str,
) -> Result<(String, Option<DateTime<Utc>>), String> {
    let metadata = match fs::metadata(path).await {
        Ok(metadata) => metadata,
        Err(e) => {
            return Err(e.to_string());
        }
    };

    let modified_at = match metadata.modified() {
        Ok(modified_at) => Some(modified_at.into()),
        Err(_) => None,
    };

    let content = match fs::read_to_string(path).await {
        Ok(content) => content,
        Err(e) => {
            return Err(e.to_string());
        }
    };

    Ok((content, modified_at))
}

pub fn show_window(app: &AppHandle) {
    let windows = app.webview_windows();

    windows
        .values()
        .next()
        .expect(t!("messages.appMainWindowMissing").into_owned().as_str())
        .set_focus()
        .expect(
            t!("messages.appMainWindowFocusedFailed")
                .into_owned()
                .as_str(),
        );
}
