import type { ResultCardProps } from '../types';
import './ResultCard.css';

/**
 * ResultCard component
 * Displays a single section of the translation result
 */
export function ResultCard({ title, content, icon, variant }: ResultCardProps) {
  return (
    <div
      className={`result-card result-card--${variant} fade-in`}
      role="region"
      aria-label={title}
    >
      <div className="result-card-header">
        <span className="result-card-icon" aria-hidden="true">{icon}</span>
        <h3 className="result-card-title">{title}</h3>
      </div>
      <div className="result-card-content">
        {content.split('\n').map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    </div>
  );
}
