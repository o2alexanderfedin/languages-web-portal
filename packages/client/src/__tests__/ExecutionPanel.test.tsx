import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ExecutionPanel } from '@/features/execution/ExecutionPanel';
import { executionApi } from '@/features/execution/executionApi';

// Create a test store
function createTestStore() {
  return configureStore({
    reducer: {
      [executionApi.reducerPath]: executionApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(executionApi.middleware),
  });
}

describe('ExecutionPanel', () => {
  it('should render Run button disabled when no projectId', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <ExecutionPanel projectId={null} />
      </Provider>,
    );

    // Check that Run button exists and shows disabled reason
    expect(screen.getByText(/Upload a project first/i)).toBeInTheDocument();

    // Find button by text pattern
    const runButton = screen.getByRole('button', { name: /Run Tool/i });
    expect(runButton).toBeDisabled();
  });

  it('should render Run button disabled when projectId exists but no tool selected', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <ExecutionPanel projectId="test-project-123" />
      </Provider>,
    );

    // Check that button shows disabled reason (exact match to avoid "Select a Tool" heading)
    expect(screen.getByText('Select a tool')).toBeInTheDocument();

    // Find button
    const runButton = screen.getByRole('button', { name: /Run Tool/i });
    expect(runButton).toBeDisabled();
  });

  it('should render tool picker section', async () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <ExecutionPanel projectId={null} />
      </Provider>,
    );

    // Check that tool picker section renders with heading
    expect(screen.getByText('Select a Tool')).toBeInTheDocument();

    // Wait for tools to render
    await waitFor(() => {
      expect(screen.getByText('C++ to C Transpiler')).toBeInTheDocument();
    });
  });
});
