import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
