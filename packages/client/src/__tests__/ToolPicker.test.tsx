import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ToolPicker } from '@/features/execution/ToolPicker';
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

describe('ToolPicker', () => {
  it('should render all 8 tool names', async () => {
    const store = createTestStore();
    const onSelectTool = vi.fn();

    render(
      <Provider store={store}>
        <ToolPicker selectedToolId={null} onSelectTool={onSelectTool} />
      </Provider>,
    );

    // Wait for tools to render (queryFn returns synchronously but React needs time to render)
    await waitFor(() => {
      expect(screen.getByText('C++ to C Transpiler')).toBeInTheDocument();
    });

    // Check for all 8 tools by name
    expect(screen.getByText('C++ to Rust Transpiler')).toBeInTheDocument();
    expect(screen.getByText('C# Verification')).toBeInTheDocument();
    expect(screen.getByText('Java Verification')).toBeInTheDocument();
    expect(screen.getByText('Rust Verification')).toBeInTheDocument();
    expect(screen.getByText('Python Linter')).toBeInTheDocument();
    expect(screen.getByText('TypeScript Linter')).toBeInTheDocument();
    expect(screen.getByText('Bash Verification')).toBeInTheDocument();
  });

  it('should render status badges with correct text', async () => {
    const store = createTestStore();
    const onSelectTool = vi.fn();

    render(
      <Provider store={store}>
        <ToolPicker selectedToolId={null} onSelectTool={onSelectTool} />
      </Provider>,
    );

    // Wait for first tool name to render
    await waitFor(() => {
      expect(screen.getByText('C++ to C Transpiler')).toBeInTheDocument();
    });

    // Check status badges exist with correct text
    const availableBadges = screen.getAllByText('Available');
    const inDevBadges = screen.getAllByText('In Development');
    const comingSoonBadges = screen.getAllByText('Coming Soon');

    expect(availableBadges.length).toBe(2); // cpp-to-c and cpp-to-rust
    expect(inDevBadges.length).toBe(3); // csharp, java, rust verification
    expect(comingSoonBadges.length).toBe(3); // python, typescript, bash
  });

  it('should call onSelectTool when clicking an available tool', async () => {
    const store = createTestStore();
    const onSelectTool = vi.fn();

    render(
      <Provider store={store}>
        <ToolPicker selectedToolId={null} onSelectTool={onSelectTool} />
      </Provider>,
    );

    // Wait for tool to render
    await waitFor(() => {
      expect(screen.getByText('C++ to C Transpiler')).toBeInTheDocument();
    });

    // Click on an available tool
    const availableTool = screen.getByText('C++ to C Transpiler').closest('div');
    expect(availableTool).not.toBeNull();
    if (availableTool) {
      fireEvent.click(availableTool);
    }

    // Verify callback was called with correct toolId
    expect(onSelectTool).toHaveBeenCalledWith('cpp-to-c-transpiler');
  });

  it('should not call onSelectTool when clicking a coming-soon tool', async () => {
    const store = createTestStore();
    const onSelectTool = vi.fn();

    render(
      <Provider store={store}>
        <ToolPicker selectedToolId={null} onSelectTool={onSelectTool} />
      </Provider>,
    );

    // Wait for tool to render
    await waitFor(() => {
      expect(screen.getByText('Python Linter')).toBeInTheDocument();
    });

    // Try to click on a coming-soon tool
    const comingSoonTool = screen.getByText('Python Linter').closest('div');
    expect(comingSoonTool).not.toBeNull();
    if (comingSoonTool) {
      fireEvent.click(comingSoonTool);
    }

    // Verify callback was NOT called
    expect(onSelectTool).not.toHaveBeenCalled();
  });

  it('should highlight selected tool with border-primary class', async () => {
    const store = createTestStore();
    const onSelectTool = vi.fn();

    render(
      <Provider store={store}>
        <ToolPicker selectedToolId="cpp-to-c-transpiler" onSelectTool={onSelectTool} />
      </Provider>,
    );

    // Wait for tool to render
    await waitFor(() => {
      expect(screen.getByText('C++ to C Transpiler')).toBeInTheDocument();
    });

    // Find the selected tool card (need to traverse up to the card div with border classes)
    const toolName = screen.getByText('C++ to C Transpiler');
    const selectedTool = toolName.closest('div.border-2');
    expect(selectedTool).not.toBeNull();
    if (selectedTool) {
      // Check for border-primary class (which indicates selection)
      expect(selectedTool.className).toContain('border-primary');
    }
  });

  it('should disable all tools when disabled prop is true', async () => {
    const store = createTestStore();
    const onSelectTool = vi.fn();

    render(
      <Provider store={store}>
        <ToolPicker selectedToolId={null} onSelectTool={onSelectTool} disabled={true} />
      </Provider>,
    );

    // Wait for tool to render
    await waitFor(() => {
      expect(screen.getByText('C++ to C Transpiler')).toBeInTheDocument();
    });

    // Try to click on an available tool
    const availableTool = screen.getByText('C++ to C Transpiler').closest('div');
    expect(availableTool).not.toBeNull();
    if (availableTool) {
      fireEvent.click(availableTool);
    }

    // Verify callback was NOT called because disabled
    expect(onSelectTool).not.toHaveBeenCalled();
  });
});
