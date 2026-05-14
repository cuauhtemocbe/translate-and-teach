import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from './Hero';

describe('Hero Component', () => {
  it('renders app title', () => {
    render(<Hero />);
    expect(screen.getByText('English Pro')).toBeInTheDocument();
  });

  it('renders tagline', () => {
    render(<Hero />);
    expect(screen.getByText('Spanish Phrase Analyzer')).toBeInTheDocument();
  });
});
