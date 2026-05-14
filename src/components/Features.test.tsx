import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Features } from './Features';

describe('Features Component', () => {
  it('renders section title', () => {
    render(<Features />);
    expect(screen.getByText('Everything You Need')).toBeInTheDocument();
  });

  it('renders all four feature cards', () => {
    render(<Features />);
    expect(screen.getByText('Smart Translation')).toBeInTheDocument();
    expect(screen.getByText('Grammar Insights')).toBeInTheDocument();
    expect(screen.getByText('Learning Tips')).toBeInTheDocument();
    expect(screen.getByText('Real Variations')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(<Features />);
    expect(screen.getByText(/Context-aware English translations/i)).toBeInTheDocument();
    expect(screen.getByText(/Detailed breakdown of sentence structure/i)).toBeInTheDocument();
  });

  it('renders feature icons', () => {
    const { container } = render(<Features />);
    const icons = container.querySelectorAll('.feature-icon');
    expect(icons).toHaveLength(4);
  });
});
