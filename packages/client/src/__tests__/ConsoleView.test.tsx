import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConsoleView } from '../features/execution/ConsoleView';

describe('ConsoleView', () => {
  it('renders output lines', () => {
    render(<ConsoleView lines={['line 1', 'line 2', 'line 3']} isStreaming={false} />);

    const consoleOutput = screen.getByText(/line 1/);
    expect(consoleOutput).toBeInTheDocument();
    expect(consoleOutput.textContent).toContain('line 1');
    expect(consoleOutput.textContent).toContain('line 2');
    expect(consoleOutput.textContent).toContain('line 3');
  });

  it('shows waiting message when no lines', () => {
    render(<ConsoleView lines={[]} isStreaming={false} />);

    expect(screen.getByText('Waiting for output...')).toBeInTheDocument();
  });

  it('shows line count when lines exist', () => {
    render(<ConsoleView lines={['line 1', 'line 2', 'line 3', 'line 4', 'line 5']} isStreaming={false} />);

    expect(screen.getByText('5 lines')).toBeInTheDocument();
  });

  it('shows singular "line" for single line', () => {
    render(<ConsoleView lines={['single line']} isStreaming={false} />);

    expect(screen.getByText('1 line')).toBeInTheDocument();
  });

  it('does not show line count when no lines', () => {
    render(<ConsoleView lines={[]} isStreaming={false} />);

    expect(screen.queryByText(/lines?/)).not.toBeInTheDocument();
  });

  it('converts ANSI codes to HTML (no raw escape sequences visible)', () => {
    // ANSI code for red text
    const linesWithAnsi = ['\x1b[31mred text\x1b[0m', '\x1b[32mgreen text\x1b[0m'];

    const { container } = render(<ConsoleView lines={linesWithAnsi} isStreaming={false} />);

    // The raw ANSI escape codes should not appear in the rendered output
    expect(container.textContent).not.toContain('\x1b[31m');
    expect(container.textContent).not.toContain('\x1b[32m');

    // The actual text should be present
    expect(container.textContent).toContain('red text');
    expect(container.textContent).toContain('green text');

    // The HTML should contain span elements with styles (ANSI converted to HTML)
    const pre = container.querySelector('pre');
    expect(pre?.innerHTML).toContain('<span');
  });

  it('shows streaming indicator when isStreaming is true', () => {
    const { container } = render(<ConsoleView lines={['output line']} isStreaming={true} />);

    // Check for the pulsing cursor element
    const cursor = container.querySelector('.animate-pulse');
    expect(cursor).toBeInTheDocument();
  });

  it('does not show streaming indicator when isStreaming is false', () => {
    const { container } = render(<ConsoleView lines={['output line']} isStreaming={false} />);

    // Check that there's no pulsing cursor
    const cursor = container.querySelector('.animate-pulse');
    expect(cursor).not.toBeInTheDocument();
  });

  it('does not show streaming indicator when no lines', () => {
    const { container } = render(<ConsoleView lines={[]} isStreaming={true} />);

    // Streaming indicator should only show when there are lines
    const cursor = container.querySelector('.animate-pulse');
    expect(cursor).not.toBeInTheDocument();
  });
});
