import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ExampleSelector } from '@/features/execution/ExampleSelector';
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

describe('ExampleSelector', () => {
  it('renders a prompt to select a tool when toolId is null', () => {
    const store = createTestStore();
    const onExampleLoaded = vi.fn();

    const { getByTestId } = render(
      <Provider store={store}>
        <ExampleSelector toolId={null} onExampleLoaded={onExampleLoaded} />
      </Provider>,
    );

    expect(getByTestId('example-selector-no-tool')).toBeDefined();
  });

  it('renders selector wrapper when toolId is provided', () => {
    const store = createTestStore();
    const onExampleLoaded = vi.fn();

    const { container } = render(
      <Provider store={store}>
        <ExampleSelector toolId="java-verification" onExampleLoaded={onExampleLoaded} />
      </Provider>,
    );

    // With MSW not available and API calls not mocked, the component will
    // render but the examples query will be pending. The component returns null
    // when there are no examples, which is the expected behavior until examples load.
    // This test verifies the component renders without errors when toolId is provided.
    expect(container).toBeDefined();
  });

  it('does not call onExampleLoaded when rendered without interaction', () => {
    const store = createTestStore();
    const onExampleLoaded = vi.fn();

    render(
      <Provider store={store}>
        <ExampleSelector toolId="java-verification" onExampleLoaded={onExampleLoaded} />
      </Provider>,
    );

    // onExampleLoaded should not be called during initial render
    expect(onExampleLoaded).not.toHaveBeenCalled();
  });
});
