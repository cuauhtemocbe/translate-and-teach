import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultsGrid } from './ResultsGrid';
import type { TranslationResponse } from '../types';

describe('ResultsGrid', () => {
  const mockResults: TranslationResponse = {
    principalTranslation: 'How are you?',
    grammaticalAnalysis: 'Subject + verb structure',
    learningKey: 'Remember this tip',
    technicalVariations: 'Formal: How do you do?',
  };

  it('should render all four result cards', () => {
    render(<ResultsGrid results={mockResults} />);

    expect(screen.getByText('Principal Translation')).toBeInTheDocument();
    expect(screen.getByText('Grammatical Analysis')).toBeInTheDocument();
    expect(screen.getByText('Learning Key')).toBeInTheDocument();
    expect(screen.getByText('Technical Variations')).toBeInTheDocument();
  });

  it('should display correct content in each card', () => {
    render(<ResultsGrid results={mockResults} />);

    expect(screen.getByText('How are you?')).toBeInTheDocument();
    expect(screen.getByText(/Subject \+ verb structure/)).toBeInTheDocument();
    expect(screen.getByText('Remember this tip')).toBeInTheDocument();
    expect(screen.getByText(/Formal: How do you do\?/)).toBeInTheDocument();
  });

  it('should apply responsive grid layout', () => {
    const { container } = render(<ResultsGrid results={mockResults} />);

    const grid = container.querySelector('.results-grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('results-grid');
  });
});
