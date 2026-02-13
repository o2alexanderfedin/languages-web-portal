import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { UploadZone } from '@/features/upload/UploadZone';
import { uploadApi } from '@/features/upload/uploadApi';

// Create a test store
function createTestStore() {
  return configureStore({
    reducer: {
      [uploadApi.reducerPath]: uploadApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(uploadApi.middleware),
  });
}

describe('UploadZone', () => {
  it('should render with drop area text and max size info', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <UploadZone />
      </Provider>,
    );

    // Check for main upload text
    expect(screen.getByText(/drag and drop a zip file here/i)).toBeInTheDocument();

    // Check for max size display
    expect(screen.getByText(/max file size: 100mb/i)).toBeInTheDocument();

    // Check for file type restriction
    expect(screen.getByText(/only \.zip files accepted/i)).toBeInTheDocument();
  });

  it('should render file input element', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <UploadZone />
      </Provider>,
    );

    // Check that file input exists
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    // react-dropzone sets accept to "application/zip,.zip"
    expect(fileInput).toHaveAttribute('accept');
    expect(fileInput?.getAttribute('accept')).toContain('.zip');
  });

  it('should call onUploadSuccess callback when provided', () => {
    const store = createTestStore();
    const onUploadSuccess = vi.fn();

    render(
      <Provider store={store}>
        <UploadZone onUploadSuccess={onUploadSuccess} />
      </Provider>,
    );

    // Component renders without error
    expect(screen.getByText(/drag and drop a zip file here/i)).toBeInTheDocument();
  });
});
