import type { TranslationResponse } from '../types';
import { ResultCard } from './ResultCard';
import './ResultsGrid.css';

interface ResultsGridProps {
  readonly results: TranslationResponse;
}

/**
 * ResultsGrid component
 * Displays all four translation result sections in a responsive grid
 */
export function ResultsGrid({ results }: ResultsGridProps) {
  return (
    <div className="results-grid">
      <ResultCard
        title="Principal Translation"
        content={results.principalTranslation}
        icon="🌐"
        variant="translation"
      />
      <ResultCard
        title="Grammatical Analysis"
        content={results.grammaticalAnalysis}
        icon="📖"
        variant="grammar"
      />
      <ResultCard title="Learning Key" content={results.learningKey} icon="💡" variant="tips" />
      <ResultCard
        title="Technical Variations"
        content={results.technicalVariations}
        icon="⚙️"
        variant="variations"
      />
    </div>
  );
}
