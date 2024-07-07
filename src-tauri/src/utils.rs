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
