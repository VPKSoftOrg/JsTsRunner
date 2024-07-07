pub fn first_missing_in_sequence(vec: &Vec<i32>) -> i32 {
    for i in 1..i32::MAX {
        if !vec.contains(&i) {
            return i;
        }
    }
    1
}
