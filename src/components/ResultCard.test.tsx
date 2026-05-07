import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultCard } from './ResultCard';

describe('ResultCard', () => {
  it('should render title and content', () => {
    render(
      <ResultCard
        title="Principal Translation"
        content="How are you?"
        icon="🌐"
        variant="translation"
      />
    );

    expect(screen.getByText('Principal Translation')).toBeInTheDocument();
    expect(screen.getByText('How are you?')).toBeInTheDocument();
    expect(screen.getByText('🌐')).toBeInTheDocument();
  });

  it('should apply correct variant class', () => {
    const { container } = render(
      <ResultCard
        title="Test"
        content="Content"
        icon="✓"
        variant="grammar"
      />
    );

    const card = container.querySelector('.result-card');
    expect(card).toHaveClass('result-card--grammar');
  });

  it('should render multiline content', () => {
    const content = 'Line 1\nLine 2\nLine 3';
    render(
      <ResultCard
        title="Test"
        content={content}
        icon="✓"
        variant="translation"
      />
    );

    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    expect(screen.getByText(/Line 2/)).toBeInTheDocument();
    expect(screen.getByText(/Line 3/)).toBeInTheDocument();
  });

  it('should have proper semantic HTML with region role', () => {
    render(
      <ResultCard
        title="Learning Key"
        content="Tips here"
        icon="💡"
        variant="tips"
      />
    );

    const region = screen.getByRole('region', { name: 'Learning Key' });
    expect(region).toBeInTheDocument();
  });
});
