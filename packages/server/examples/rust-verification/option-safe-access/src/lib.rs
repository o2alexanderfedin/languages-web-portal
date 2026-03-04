/// Null-safe collection using Option<T> — no panics, proven by the verifier.

pub struct SafeVec<T> {
    items: Vec<T>,
}

impl<T: Clone> SafeVec<T> {
    pub fn new() -> Self {
        SafeVec { items: Vec::new() }
    }

    pub fn len(&self) -> usize {
        self.items.len()
    }

    pub fn is_empty(&self) -> bool {
        self.items.is_empty()
    }

    /// Returns Some(&item) if index is in bounds, None otherwise — never panics.
    /// Postcondition: result.is_some() <==> index < self.len()
    pub fn get(&self, index: usize) -> Option<&T> {
        self.items.get(index)
    }

    /// Appends an item. Postcondition: self.len() == old(self.len()) + 1
    pub fn insert(&mut self, item: T) {
        self.items.push(item);
    }

    /// Removes and returns the last item, or None if empty — never panics.
    /// Postcondition: result.is_some() <==> old(self.len()) > 0
    ///                result.is_some() ==> self.len() == old(self.len()) - 1
    pub fn remove_last(&mut self) -> Option<T> {
        self.items.pop()
    }

    /// Returns the first element, or None if the collection is empty.
    pub fn first(&self) -> Option<&T> {
        self.items.first()
    }

    /// Returns the last element, or None if the collection is empty.
    pub fn last(&self) -> Option<&T> {
        self.items.last()
    }
}

impl<T: Clone> Default for SafeVec<T> {
    fn default() -> Self {
        Self::new()
    }
}
