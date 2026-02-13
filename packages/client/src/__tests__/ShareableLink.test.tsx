import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ShareableLink } from '@/features/landing/ShareableLink';

describe('ShareableLink', () => {
  it('shows disabled state when no toolId provided', () => {
    render(<ShareableLink toolId={null} />);

    const input = screen.getByPlaceholderText(/Select a tool to generate a shareable link/i) as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(input.value).toBe('');

    const button = screen.getByRole('button', { name: /Copy Link/i });
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('shows correct shareable URL when toolId is "cpp-to-c-transpiler"', () => {
    render(<ShareableLink toolId="cpp-to-c-transpiler" />);

    const input = screen.getByDisplayValue(/\/demo\?tool=cpp-to-c-transpiler/i) as HTMLInputElement;
    expect(input.value).toContain('/demo?tool=cpp-to-c-transpiler');
    expect(input.disabled).toBe(false);
  });

  it('shows "Copied!" feedback after clicking copy button', async () => {
    const user = userEvent.setup();
    render(<ShareableLink toolId="cpp-to-c-transpiler" />);

    const button = screen.getByRole('button', { name: /Copy Link/i });
    await user.click(button);

    // Should show "Copied!" feedback after click
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Copied!/i })).toBeDefined();
    });
  });

  it('reverts "Copied!" feedback back to "Copy Link" after 2 seconds', async () => {
    const user = userEvent.setup();
    render(<ShareableLink toolId="cpp-to-c-transpiler" />);

    const button = screen.getByRole('button', { name: /Copy Link/i });
    await user.click(button);

    // Should show "Copied!" immediately
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Copied!/i })).toBeDefined();
    });

    // After 2 seconds, should revert to "Copy Link" (wait for real timeout)
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /Copy Link/i })).toBeDefined();
      },
      { timeout: 3000 }
    );
  });

  it('shows the URL in a readonly input field', () => {
    render(<ShareableLink toolId="cpp-to-c-transpiler" />);

    const input = screen.getByDisplayValue(/\/demo\?tool=cpp-to-c-transpiler/i) as HTMLInputElement;
    expect(input.readOnly).toBe(true);
  });

  it('updates URL when toolId changes', () => {
    const { rerender } = render(<ShareableLink toolId="cpp-to-c-transpiler" />);

    let input = screen.getByDisplayValue(/\/demo\?tool=cpp-to-c-transpiler/i) as HTMLInputElement;
    expect(input.value).toContain('/demo?tool=cpp-to-c-transpiler');

    // Update with different toolId
    rerender(<ShareableLink toolId="cpp-to-rust-transpiler" />);

    input = screen.getByDisplayValue(/\/demo\?tool=cpp-to-rust-transpiler/i) as HTMLInputElement;
    expect(input.value).toContain('/demo?tool=cpp-to-rust-transpiler');
  });

  it('button is disabled when no toolId is provided', () => {
    render(<ShareableLink toolId={null} />);

    const button = screen.getByRole('button', { name: /Copy Link/i });
    expect(button).toBeDisabled();
  });

  it('button is enabled when toolId is provided', () => {
    render(<ShareableLink toolId="cpp-to-c-transpiler" />);

    const button = screen.getByRole('button', { name: /Copy Link/i });
    expect(button).not.toBeDisabled();
  });
});
