/**
 * Integration tests for the full translation flow
 * Tests timer + markdown rendering working together
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import * as togetherApi from '../services/togetherApi';

// Mock the API
vi.mock('../services/togetherApi', () => ({
  translatePhrase: vi.fn(),
}));

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Full translation flow with timer and markdown', () => {
    it('should complete full flow: submit → timer → API → markdown results', async () => {
      // Mock API response with markdown formatting
      const mockResponse = `## Principal Translation
The **main** translation with *emphasis*.

## Grammatical Analysis
Analysis with:
- Point one
- Point two

## Learning Key
Key points:
1. First tip
2. Second tip

## Technical Variations
Variations here`;

      vi.mocked(togetherApi.translatePhrase).mockResolvedValueOnce(mockResponse);

      const user = userEvent.setup();
      const { container } = render(<App />);

      // Step 1: Enter Spanish phrase
      const input = screen.getByPlaceholderText(/Escribe una frase/i);
      await user.type(input, 'Hola mundo');

      // Step 2: Submit translation
      const button = screen.getByRole('button', { name: /Generar traducción/i });
      await user.click(button);

      // Step 3: Verify API was called
      expect(togetherApi.translatePhrase).toHaveBeenCalledWith('Hola mundo');

      // Step 4: Wait for results to appear
      await waitFor(() => {
        expect(screen.getByText('Principal Translation')).toBeInTheDocument();
      });

      // Step 5: Verify button shows completion time
      expect(screen.getByText(/Completado en/i)).toBeInTheDocument();
      const buttonText = screen.getByText(/Completado en/i).textContent;
      expect(buttonText).toMatch(/Completado en \d+\.\d+s/);

      // Step 6: Verify markdown is rendered (bold)
      const strongElements = container.querySelectorAll('strong');
      expect(strongElements.length).toBeGreaterThan(0);
      expect(Array.from(strongElements).some((el) => el.textContent === 'main')).toBe(true);

      // Step 7: Verify markdown is rendered (italic)
      const emElements = container.querySelectorAll('em');
      expect(emElements.length).toBeGreaterThan(0);
      expect(Array.from(emElements).some((el) => el.textContent === 'emphasis')).toBe(true);

      // Step 8: Verify markdown is rendered (bullet list)
      const ulElements = container.querySelectorAll('ul');
      expect(ulElements.length).toBeGreaterThan(0);

      // Step 9: Verify markdown is rendered (numbered list)
      const olElements = container.querySelectorAll('ol');
      expect(olElements.length).toBeGreaterThan(0);

      // Step 10: Verify all four result cards are present
      expect(screen.getByText('Principal Translation')).toBeInTheDocument();
      expect(screen.getByText('Grammatical Analysis')).toBeInTheDocument();
      expect(screen.getByText('Learning Key')).toBeInTheDocument();
      expect(screen.getByText('Technical Variations')).toBeInTheDocument();
    });

    it('should show timer even when API fails', async () => {
      vi.mocked(togetherApi.translatePhrase).mockRejectedValueOnce(new Error('Network error'));

      const user = userEvent.setup();
      render(<App />);

      const input = screen.getByPlaceholderText(/Escribe una frase/i);
      await user.type(input, 'Test');

      const button = screen.getByRole('button', { name: /Generar traducción/i });
      await user.click(button);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });

      // Button should still show elapsed time
      expect(screen.getByText(/Completado en/i)).toBeInTheDocument();

      // Results should NOT be shown
      expect(screen.queryByText('Principal Translation')).not.toBeInTheDocument();
    });

    it('should reset timer and show new markdown on second translation', async () => {
      // First response
      const firstResponse = `## Principal Translation
This is the **first** translation.

## Grammatical Analysis
First analysis content.

## Learning Key
First learning tip.

## Technical Variations
First variation example.`;

      // Second response
      const secondResponse = `## Principal Translation
This is the *second* translation.

## Grammatical Analysis
Second analysis content.

## Learning Key
Second learning tip.

## Technical Variations
Second variation example.`;

      vi.mocked(togetherApi.translatePhrase)
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse);

      const user = userEvent.setup();
      const { container } = render(<App />);

      const input = screen.getByPlaceholderText(/Escribe una frase/i);
      const button = screen.getByRole('button', { name: /Generar traducción/i });

      // First translation
      await user.type(input, 'Primero');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/This is the/i)).toBeInTheDocument();
      });

      // Verify button showed completion
      expect(screen.getByText(/Completado en/i)).toBeInTheDocument();

      // Verify first markdown (bold "first")
      const strongElements = container.querySelectorAll('strong');
      expect(Array.from(strongElements).some((el) => el.textContent === 'first')).toBe(true);

      // Second translation
      await user.clear(input);
      await user.type(input, 'Segundo');
      await user.click(button);

      await waitFor(() => {
        // Check for the italic "second" in the translation
        const emElements = container.querySelectorAll('em');
        expect(Array.from(emElements).some((el) => el.textContent === 'second')).toBe(true);
      });

      // Verify button still shows completion (reset and updated)
      expect(screen.getByText(/Completado en/i)).toBeInTheDocument();

      // Verify second markdown (italic "second")
      const emElements = container.querySelectorAll('em');
      expect(Array.from(emElements).some((el) => el.textContent === 'second')).toBe(true);

      // First content should be gone
      expect(screen.queryByText(/first/i)).not.toBeInTheDocument();
    });
  });

  describe('Markdown rendering in all result cards', () => {
    it('should render markdown in all four result sections', async () => {
      const mockResponse = `## Principal Translation
This has **bold** text in translation.

## Grammatical Analysis
This has *italic* text in grammar.

## Learning Key
Key points:
- Bullet one
- Bullet two

## Technical Variations
Variations list:
1. Variation one
2. Variation two`;

      vi.mocked(togetherApi.translatePhrase).mockResolvedValueOnce(mockResponse);

      const user = userEvent.setup();
      const { container } = render(<App />);

      const input = screen.getByPlaceholderText(/Escribe una frase/i);
      await user.type(input, 'Test');

      const button = screen.getByRole('button', { name: /Generar traducción/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Principal Translation')).toBeInTheDocument();
      });

      // Verify markdown rendered in each section
      // Bold in translation section
      const strong = container.querySelector('strong');
      expect(strong).toBeInTheDocument();
      expect(strong?.textContent).toBe('bold');

      // Italic in grammar section
      const em = container.querySelector('em');
      expect(em).toBeInTheDocument();
      expect(em?.textContent).toBe('italic');

      // Bullet list in learning key section
      const ul = container.querySelector('ul');
      expect(ul).toBeInTheDocument();
      const ulItems = ul?.querySelectorAll('li');
      expect(ulItems).toHaveLength(2);

      // Numbered list in variations section
      const ol = container.querySelector('ol');
      expect(ol).toBeInTheDocument();
      const olItems = ol?.querySelectorAll('li');
      expect(olItems).toHaveLength(2);
    });
  });
});
