import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

/**
 * Custom hook for theme management
 * Persists theme preference to localStorage
 * Defaults to dark theme
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first, default to dark
    const stored = localStorage.getItem('theme') as Theme | null;
    return stored || 'dark';
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);

    // Persist to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
}
