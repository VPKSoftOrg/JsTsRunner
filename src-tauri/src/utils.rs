use chrono::{DateTime, Utc};
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
