import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TranslationTimer } from './TranslationTimer';

describe('TranslationTimer', () => {
  describe('when elapsedTime is null', () => {
    it('should render nothing when loading', () => {
      const { container } = render(
        <TranslationTimer isLoading={true} elapsedTime={null} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when not loading', () => {
      const { container } = render(
        <TranslationTimer isLoading={false} elapsedTime={null} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('when loading', () => {
    it('should show "Translating..." with elapsed time', () => {
      render(
        <TranslationTimer isLoading={true} elapsedTime={2.3} />
      );

      expect(screen.getByText(/Translating\.\.\. 2\.3s/)).toBeInTheDocument();
    });

    it('should format time to one decimal place', () => {
      render(
        <TranslationTimer isLoading={true} elapsedTime={1.456} />
      );

      expect(screen.getByText(/Translating\.\.\. 1\.5s/)).toBeInTheDocument();
    });

    it('should have role="status" for accessibility', () => {
      render(
        <TranslationTimer isLoading={true} elapsedTime={2.0} />
      );

      const timer = screen.getByRole('status');
      expect(timer).toBeInTheDocument();
      expect(timer).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('when completed', () => {
    it('should show "Translation completed in" with elapsed time', () => {
      render(
        <TranslationTimer isLoading={false} elapsedTime={3.7} />
      );

      expect(screen.getByText(/Translation completed in 3\.7s/)).toBeInTheDocument();
    });

    it('should format time to one decimal place', () => {
      render(
        <TranslationTimer isLoading={false} elapsedTime={2.999} />
      );

      expect(screen.getByText(/Translation completed in 3\.0s/)).toBeInTheDocument();
    });

    it('should apply completed modifier class', () => {
      const { container } = render(
        <TranslationTimer isLoading={false} elapsedTime={2.5} />
      );

      const timer = container.querySelector('.translation-timer');
      expect(timer).toHaveClass('translation-timer--completed');
    });

    it('should handle zero elapsed time', () => {
      render(
        <TranslationTimer isLoading={false} elapsedTime={0.0} />
      );

      expect(screen.getByText(/Translation completed in 0\.0s/)).toBeInTheDocument();
    });
  });
});
