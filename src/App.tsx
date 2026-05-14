import { useState, useRef, useEffect } from 'react';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { InputSection } from './components/InputSection';
import { ResultsGrid } from './components/ResultsGrid';
import { ThemeToggle } from './components/ThemeToggle';
import { useTheme } from './hooks/useTheme';
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
  const [elapsedTime, setElapsedTime] = useState<number | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const completionTimeoutRef = useRef<number | null>(null);
  const { theme, toggleTheme } = useTheme();

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
    setElapsedTime(0);
    setShowCompletion(false);

    // Clear any existing timers
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
    }

    // Start timer
    const startTime = performance.now();

    // Update elapsed time every 100ms during loading
    timerIntervalRef.current = window.setInterval(() => {
      const currentTime = performance.now();
      const elapsed = (currentTime - startTime) / 1000;
      setElapsedTime(elapsed);
    }, 100);

    try {
      // Call API
      const response = await translatePhrase(input.trim());

      // Stop timer and calculate final elapsed time
      clearInterval(timerIntervalRef.current);
      const endTime = performance.now();
      const elapsed = (endTime - startTime) / 1000;
      setElapsedTime(elapsed);

      // Parse response
      const parsed = parseResponse(response);

      // Set results
      setResults(parsed);

      // Show completion message
      setShowCompletion(true);

      // Hide completion message after 3 seconds
      completionTimeoutRef.current = window.setTimeout(() => {
        setShowCompletion(false);
      }, 3000);
    } catch (err) {
      // Stop timer even on error
      clearInterval(timerIntervalRef.current);
      const endTime = performance.now();
      const elapsed = (endTime - startTime) / 1000;
      setElapsedTime(elapsed);

      // Handle errors
      const errorMessage = err instanceof Error
        ? err.message
        : 'Ocurrió un error al generar la traducción. Intenta de nuevo.';

      setError(errorMessage);

      // Show completion message briefly even on error
      setShowCompletion(true);
      completionTimeoutRef.current = window.setTimeout(() => {
        setShowCompletion(false);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="app">
      {/* Skip to main content link for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Theme toggle button */}
      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      <Hero />

      <main
        id="main-content"
        className="container"
        style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-xl)' }}
      >
        <InputSection
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          elapsedTime={elapsedTime}
          showCompletion={showCompletion}
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

      {/* Features section - only show when no results */}
      {!results && <Features />}

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
