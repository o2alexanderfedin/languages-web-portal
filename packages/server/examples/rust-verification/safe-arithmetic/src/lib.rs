/// Integer arithmetic with overflow and division-by-zero safety contracts.

/// Safe addition — no overflow.
#[doc = "rust_fv::pure"]
#[doc = "rust_fv::ensures::result == a + b"]
pub fn safe_add(a: i64, b: i64) -> i64 {
    a.checked_add(b).expect("addition overflow")
}

/// Safe subtraction — no underflow.
#[doc = "rust_fv::pure"]
#[doc = "rust_fv::ensures::result == a - b"]
pub fn safe_sub(a: i64, b: i64) -> i64 {
    a.checked_sub(b).expect("subtraction underflow")
}

/// Safe multiplication — no overflow.
#[doc = "rust_fv::pure"]
#[doc = "rust_fv::ensures::result == a * b"]
pub fn safe_mul(a: i64, b: i64) -> i64 {
    a.checked_mul(b).expect("multiplication overflow")
}

/// Safe division — requires b != 0.
#[doc = "rust_fv::pure"]
#[doc = "rust_fv::requires::b != 0"]
#[doc = "rust_fv::ensures::result == a / b"]
pub fn safe_div(a: i64, b: i64) -> i64 {
    assert!(b != 0, "division by zero");
    a / b
}

/// Intentional bug: unchecked multiplication can overflow for large inputs.
/// The verifier flags this arithmetic safety violation.
#[doc = "rust_fv::pure"]
#[doc = "rust_fv::ensures::result == a * b"]
pub fn mul_buggy(a: i64, b: i64) -> i64 {
    // BUG: no overflow check — wraps on large inputs
    a * b
}

/// Absolute value — result is always non-negative.
#[doc = "rust_fv::pure"]
#[doc = "rust_fv::ensures::result >= 0"]
#[doc = "rust_fv::ensures::(a >= 0 && result == a) || (a < 0 && result == -a)"]
pub fn abs_val(a: i64) -> i64 {
    if a < 0 { -a } else { a }
}

/// Clamps value to [min_val, max_val].
#[doc = "rust_fv::pure"]
#[doc = "rust_fv::requires::min_val <= max_val"]
#[doc = "rust_fv::ensures::result >= min_val && result <= max_val"]
pub fn clamp(value: i64, min_val: i64, max_val: i64) -> i64 {
    assert!(min_val <= max_val, "min must be <= max");
    value.max(min_val).min(max_val)
}
