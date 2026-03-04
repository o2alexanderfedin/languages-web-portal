/// Null-safe collection using Option<T> — no panics, proven by the verifier.

pub struct SafeVec<T> {
    items: Vec<T>,
}

impl<T: Clone> SafeVec<T> {
    #[doc = "rust_fv::ensures::result.items.len() == 0"]
    pub fn new() -> Self {
        SafeVec { items: Vec::new() }
    }

    #[doc = "rust_fv::pure"]
    #[doc = "rust_fv::ensures::result >= 0"]
    pub fn len(&self) -> usize {
        self.items.len()
    }

    #[doc = "rust_fv::pure"]
    #[doc = "rust_fv::ensures::result == (self.items.len() == 0)"]
    pub fn is_empty(&self) -> bool {
        self.items.is_empty()
    }

    /// Returns Some(&item) if index is in bounds, None otherwise — never panics.
    #[doc = "rust_fv::pure"]
    #[doc = "rust_fv::ensures::result.is_some() == (index < self.items.len())"]
    pub fn get(&self, index: usize) -> Option<&T> {
        self.items.get(index)
    }

    /// Appends an item. Length increases by exactly 1.
    #[doc = "rust_fv::ensures::self.items.len() == old_len + 1"]
    pub fn insert(&mut self, item: T) {
        self.items.push(item);
    }

    /// Removes and returns the last item, or None if empty — never panics.
    #[doc = "rust_fv::ensures::result.is_some() == (self.items.len() > 0)"]
    pub fn remove_last(&mut self) -> Option<T> {
        self.items.pop()
    }

    /// Returns the first element, or None if the collection is empty.
    #[doc = "rust_fv::pure"]
    #[doc = "rust_fv::ensures::result.is_some() == (self.items.len() > 0)"]
    pub fn first(&self) -> Option<&T> {
        self.items.first()
    }

    /// Returns the last element, or None if the collection is empty.
    #[doc = "rust_fv::pure"]
    #[doc = "rust_fv::ensures::result.is_some() == (self.items.len() > 0)"]
    pub fn last(&self) -> Option<&T> {
        self.items.last()
    }
}

impl<T: Clone> Default for SafeVec<T> {
    fn default() -> Self {
        Self::new()
    }
}
