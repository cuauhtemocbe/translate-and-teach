import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import * as togetherApi from '../services/togetherApi';

// Mock the API
vi.mock('../services/togetherApi', () => ({
  translatePhrase: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header and input section', () => {
    render(<App />);

    expect(screen.getByText(/English Pro/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Escribe una frase/i)).toBeInTheDocument();
  });

  it('should handle successful translation flow', async () => {
    const mockResponse = `## Principal Translation
Hello

## Grammatical Analysis
Simple greeting

## Learning Key
Common phrase

## Technical Variations
Hi, Hey`;

    vi.mocked(togetherApi.translatePhrase).mockResolvedValueOnce(mockResponse);

    const user = userEvent.setup();
    render(<App />);

    // Enter text
    const input = screen.getByPlaceholderText(/Escribe una frase/i);
    await user.type(input, 'Hola');

    // Submit
    const button = screen.getByRole('button', { name: /Generar traducción/i });
    await user.click(button);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Principal Translation')).toBeInTheDocument();
    });

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Simple greeting')).toBeInTheDocument();
  });

  it('should display error message on API failure', async () => {
    vi.mocked(togetherApi.translatePhrase).mockRejectedValueOnce(
      new Error('API error: 500 Internal Server Error')
    );

    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByPlaceholderText(/Escribe una frase/i);
    await user.type(input, 'Test');

    const button = screen.getByRole('button', { name: /Generar traducción/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/API error/i)).toBeInTheDocument();
    });

    // Results should not be shown
    expect(screen.queryByText('Principal Translation')).not.toBeInTheDocument();
  });

  it('should show loading state during API call', async () => {
    vi.mocked(togetherApi.translatePhrase).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve('## Principal Translation\nTest'), 100))
    );

    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByPlaceholderText(/Escribe una frase/i);
    await user.type(input, 'Test');

    const button = screen.getByRole('button', { name: /Generar traducción/i });
    await user.click(button);

    // Should show loading state
    expect(screen.getByText(/Traduciendo/i)).toBeInTheDocument();
    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText(/Traduciendo/i)).not.toBeInTheDocument();
    });
  });

  it('should clear error on new submission', async () => {
    // First submission fails
    vi.mocked(togetherApi.translatePhrase).mockRejectedValueOnce(
      new Error('Network error')
    );

    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByPlaceholderText(/Escribe una frase/i);
    await user.type(input, 'Test1');

    const button = screen.getByRole('button', { name: /Generar traducción/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });

    // Second submission succeeds
    vi.mocked(togetherApi.translatePhrase).mockResolvedValueOnce(
      '## Principal Translation\nSuccess'
    );

    await user.clear(input);
    await user.type(input, 'Test2');
    await user.click(button);

    await waitFor(() => {
      expect(screen.queryByText(/Network error/i)).not.toBeInTheDocument();
    });
  });

  it('should have accessible form structure', () => {
    render(<App />);

    // Header should be a banner
    expect(screen.getByRole('banner')).toBeInTheDocument();

    // Main content should be in main element
    const main = document.querySelector('main');
    expect(main).toBeInTheDocument();

    // Input should have label
    const input = screen.getByPlaceholderText(/Escribe una frase/i);
    expect(input).toHaveAccessibleName();
  });

  describe('Timer functionality', () => {
    it('should show elapsed time on button after successful translation', async () => {
      vi.mocked(togetherApi.translatePhrase).mockResolvedValueOnce(
        '## Principal Translation\nHello'
      );

      const user = userEvent.setup();
      render(<App />);

      const input = screen.getByPlaceholderText(/Escribe una frase/i);
      await user.type(input, 'Hola');

      const button = screen.getByRole('button', { name: /Generar traducción/i });
      await user.click(button);

      // Verify button shows completion message with time
      await waitFor(() => {
        expect(screen.getByText(/Completado en/i)).toBeInTheDocument();
      });

      // Verify time is displayed in format X.Xs
      const buttonText = screen.getByText(/Completado en/i).textContent;
      expect(buttonText).toMatch(/Completado en \d+\.\d+s/);
    });

    it('should show elapsed time on button even when API fails', async () => {
      vi.mocked(togetherApi.translatePhrase).mockRejectedValueOnce(
        new Error('API error')
      );

      const user = userEvent.setup();
      render(<App />);

      const input = screen.getByPlaceholderText(/Escribe una frase/i);
      await user.type(input, 'Test');

      const button = screen.getByRole('button', { name: /Generar traducción/i });
      await user.click(button);

      // Button should show completion time even on error
      await waitFor(() => {
        expect(screen.getByText(/Completado en/i)).toBeInTheDocument();
      });

      // Verify time is displayed
      const buttonText = screen.getByText(/Completado en/i).textContent;
      expect(buttonText).toMatch(/Completado en \d+\.\d+s/);
    });

    it('should show normal button text initially', () => {
      render(<App />);

      // Button should show normal text initially
      expect(screen.getByText(/Generar traducción/i)).toBeInTheDocument();
      expect(screen.queryByText(/Completado en/i)).not.toBeInTheDocument();
    });
  });
});
