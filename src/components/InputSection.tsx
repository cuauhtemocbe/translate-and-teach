import './InputSection.css';

interface InputSectionProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
  elapsedTime: number | null;
  showCompletion: boolean;
}

/**
 * InputSection component
 * Contains textarea input and submit button
 */
export function InputSection({ value, onChange, onSubmit, loading, error, elapsedTime, showCompletion }: InputSectionProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <section className="input-section">
      <div className="input-container">
        <label htmlFor="spanish-input" className="sr-only">
          Spanish phrase input
        </label>
        <textarea
          id="spanish-input"
          className="input-field"
          placeholder="Escribe una frase en español..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          rows={3}
          aria-describedby={error ? 'input-error' : undefined}
        />

        {error && (
          <div id="input-error" className="error-message" role="alert">
            <span className="error-icon" aria-hidden="true">⚠️</span>
            {error}
          </div>
        )}

        <button
          className="submit-button"
          onClick={onSubmit}
          disabled={loading || !value.trim()}
          aria-busy={loading}
        >
          {loading && elapsedTime != null ? (
            <>
              <span className="spinner" aria-hidden="true"></span>
              Traduciendo... {elapsedTime.toFixed(1)}s
            </>
          ) : loading ? (
            <>
              <span className="spinner" aria-hidden="true"></span>
              Traduciendo...
            </>
          ) : showCompletion && elapsedTime != null ? (
            <>
              <span aria-hidden="true">✓</span>
              Completado en {elapsedTime.toFixed(1)}s
            </>
          ) : (
            <>
              <span aria-hidden="true">🔍</span>
              Generar traducción
            </>
          )}
        </button>
      </div>
    </section>
  );
}
