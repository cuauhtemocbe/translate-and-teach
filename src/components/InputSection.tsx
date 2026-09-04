import './InputSection.css';

interface InputSectionProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly loading: boolean;
  readonly error: string | null;
  readonly elapsedTime: number | null;
  readonly showCompletion: boolean;
}

function renderSubmitButtonContent(
  loading: boolean,
  elapsedTime: number | null,
  showCompletion: boolean,
) {
  if (loading && elapsedTime != null) {
    const seconds = `${elapsedTime.toFixed(1)}s`;
    return (
      <>
        <span className="spinner" aria-hidden="true"></span> Traduciendo... {seconds}
      </>
    );
  }

  if (loading) {
    return (
      <>
        <span className="spinner" aria-hidden="true"></span> Traduciendo...
      </>
    );
  }

  if (showCompletion && elapsedTime != null) {
    return (
      <>
        <span aria-hidden="true">✓</span> Completado en {elapsedTime.toFixed(1)}s
      </>
    );
  }

  return (
    <>
      <span aria-hidden="true">🔍</span> Generar traducción
    </>
  );
}

/**
 * InputSection component
 * Contains textarea input and submit button
 */
export function InputSection({
  value,
  onChange,
  onSubmit,
  loading,
  error,
  elapsedTime,
  showCompletion,
}: Readonly<InputSectionProps>) {
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
            <span className="error-icon" aria-hidden="true">
              ⚠️
            </span>
            {error}
          </div>
        )}

        <button
          type="button"
          className="submit-button"
          onClick={onSubmit}
          disabled={loading || !value.trim()}
          aria-busy={loading}
        >
          {renderSubmitButtonContent(loading, elapsedTime, showCompletion)}
        </button>
      </div>
    </section>
  );
}
