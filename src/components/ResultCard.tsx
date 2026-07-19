import ReactMarkdown from 'react-markdown';
import type { ResultCardProps } from '../types';
import './ResultCard.css';

/**
 * ResultCard component
 * Displays a single section of the translation result with markdown rendering
 */
export function ResultCard({ title, content, icon, variant }: ResultCardProps) {
  return (
    <section className={`result-card result-card--${variant} fade-in`} aria-label={title}>
      <div className="result-card-header">
        <span className="result-card-icon" aria-hidden="true">
          {icon}
        </span>
        <h3 className="result-card-title">{title}</h3>
      </div>
      <div className="result-card-content">
        <ReactMarkdown
          allowedElements={['p', 'strong', 'em', 'ul', 'ol', 'li']}
          unwrapDisallowed={true}
        >
          {content}
        </ReactMarkdown>
      </div>
    </section>
  );
}
