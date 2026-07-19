import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  it('should render with dark theme icon', () => {
    render(<ThemeToggle theme="dark" onToggle={() => {}} />);
    expect(screen.getByText('☀️')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
  });

  it('should render with light theme icon', () => {
    render(<ThemeToggle theme="light" onToggle={() => {}} />);
    expect(screen.getByText('🌙')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  it('should call onToggle when clicked', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();

    render(<ThemeToggle theme="dark" onToggle={onToggle} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should have accessible label', () => {
    render(<ThemeToggle theme="dark" onToggle={() => {}} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAccessibleName('Switch to light theme');
  });

  it('should update aria-label based on theme', () => {
    const { rerender } = render(<ThemeToggle theme="dark" onToggle={() => {}} />);
    expect(screen.getByRole('button')).toHaveAccessibleName('Switch to light theme');

    rerender(<ThemeToggle theme="light" onToggle={() => {}} />);
    expect(screen.getByRole('button')).toHaveAccessibleName('Switch to dark theme');
  });
});
