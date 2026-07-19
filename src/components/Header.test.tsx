import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Header } from './Header';

describe('Header', () => {
  it('should render the app title', () => {
    render(<Header />);

    expect(screen.getByText(/English Pro/i)).toBeInTheDocument();
  });

  it('should render the tagline', () => {
    render(<Header />);

    expect(screen.getByText(/Spanish Phrase Analyzer/i)).toBeInTheDocument();
  });

  it('should have proper semantic HTML', () => {
    render(<Header />);

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });

  it('should render as a header element', () => {
    const { container } = render(<Header />);

    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
  });
});
