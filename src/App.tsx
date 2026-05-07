import { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { ResultsGrid } from './components/ResultsGrid';
import { translatePhrase } from './services/togetherApi';
import { parseResponse } from './utils/parseResponse';
import type { TranslationResponse } from './types';
import './styles/globals.css';

/**
 * Main App component for English Pro
 * Orchestrates the translation workflow
 */
export function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TranslationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus results when they appear
  useEffect(() => {
    if (results && resultsRef.current) {
      resultsRef.current.focus();
    }
  }, [results]);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Call API
      const response = await translatePhrase(input.trim());

      // Parse response
      const parsed = parseResponse(response);

      // Set results
      setResults(parsed);
    } catch (err) {
      // Handle errors
      const errorMessage = err instanceof Error
        ? err.message
        : 'Ocurrió un error al generar la traducción. Intenta de nuevo.';

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Skip to main content link for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header />

      <main
        id="main-content"
        className="container"
        style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)' }}
      >
        <InputSection
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />

        {results && (
          <div
            ref={resultsRef}
            tabIndex={-1}
            aria-live="polite"
            aria-atomic="true"
            style={{ outline: 'none' }}
          >
            <ResultsGrid results={results} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>
            Powered by{' '}
            <a
              href="https://together.ai"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Together.ai (opens in new tab)"
            >
              Together.ai
            </a>
            {' '}using Llama-3.3-70B
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
