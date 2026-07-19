import './TranslationTimer.css';

/**
 * TranslationTimer component
 * Displays elapsed time during translation and final completion time
 */

export interface TranslationTimerProps {
  /** Whether translation is currently in progress */
  isLoading: boolean;
  /** Elapsed time in seconds (null if no translation has been made) */
  elapsedTime: number | null;
}

/**
 * Displays translation timing information
 * - Shows live timer during loading: "Translating... X.Xs"
 * - Shows final time after completion: "Translation completed in X.Xs"
 * - Renders nothing when elapsedTime is null
 */
export function TranslationTimer({ isLoading, elapsedTime }: TranslationTimerProps) {
  // Don't render anything if no timing data
  if (elapsedTime === null) {
    return null;
  }

  // Format time to one decimal place
  const formattedTime = elapsedTime.toFixed(1);

  if (isLoading) {
    return (
      <div className="translation-timer" role="status" aria-live="polite">
        <span className="translation-timer__text">Translating... {formattedTime}s</span>
      </div>
    );
  }

  return (
    <div className="translation-timer translation-timer--completed">
      <span className="translation-timer__text">Translation completed in {formattedTime}s</span>
    </div>
  );
}
