using System;
using System.Collections.Generic;

namespace ArrayBoundsExample
{
    public class SafeArray<T>
    {
        private readonly T[] items;

        public int Length => items.Length;

        public SafeArray(int size)
        {
            if (size < 0)
                throw new ArgumentException("Array size must be non-negative", nameof(size));

            items = new T[size];
        }

        // Safe indexer with bounds checking
        public T this[int index]
        {
            get
            {
                if (index < 0 || index >= items.Length)
                    throw new IndexOutOfRangeException(
                        $"Index {index} is out of range [0, {items.Length})");

                return items[index];
            }
            set
            {
                if (index < 0 || index >= items.Length)
                    throw new IndexOutOfRangeException(
                        $"Index {index} is out of range [0, {items.Length})");

                items[index] = value;
            }
        }

        // Safe method with range validation
        public void Fill(T value, int start, int count)
        {
            if (start < 0 || start >= items.Length)
                throw new ArgumentOutOfRangeException(nameof(start));

            if (count < 0 || start + count > items.Length)
                throw new ArgumentOutOfRangeException(nameof(count));

            for (int i = start; i < start + count; i++)
            {
                items[i] = value;
            }
        }

        // Safe slice operation
        public T[] Slice(int start, int length)
        {
            if (start < 0 || start >= items.Length)
                throw new ArgumentOutOfRangeException(nameof(start));

            if (length < 0 || start + length > items.Length)
                throw new ArgumentOutOfRangeException(nameof(length));

            T[] result = new T[length];
            Array.Copy(items, start, result, 0, length);
            return result;
        }
    }

    class Program
    {
        static void Main()
        {
            var arr = new SafeArray<int>(10);

            // Safe operations with bounds checking
            arr.Fill(5, 0, 5);
            arr[3] = 42;

            Console.WriteLine($"Element at index 3: {arr[3]}");

            // Safe slice
            int[] slice = arr.Slice(2, 4);
            Console.WriteLine($"Slice length: {slice.Length}");
        }
    }
}
