import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResultCard } from './ResultCard';

describe('ResultCard', () => {
  it('should render title and content', () => {
    render(
      <ResultCard
        title="Principal Translation"
        content="How are you?"
        icon="🌐"
        variant="translation"
      />,
    );

    expect(screen.getByText('Principal Translation')).toBeInTheDocument();
    expect(screen.getByText('How are you?')).toBeInTheDocument();
    expect(screen.getByText('🌐')).toBeInTheDocument();
  });

  it('should apply correct variant class', () => {
    const { container } = render(
      <ResultCard title="Test" content="Content" icon="✓" variant="grammar" />,
    );

    const card = container.querySelector('.result-card');
    expect(card).toHaveClass('result-card--grammar');
  });

  it('should render multiline content', () => {
    const content = 'Line 1\nLine 2\nLine 3';
    render(<ResultCard title="Test" content={content} icon="✓" variant="translation" />);

    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    expect(screen.getByText(/Line 2/)).toBeInTheDocument();
    expect(screen.getByText(/Line 3/)).toBeInTheDocument();
  });

  it('should have proper semantic HTML with region role', () => {
    render(<ResultCard title="Learning Key" content="Tips here" icon="💡" variant="tips" />);

    const region = screen.getByRole('region', { name: 'Learning Key' });
    expect(region).toBeInTheDocument();
  });

  describe('Markdown rendering', () => {
    it('should render bold text', () => {
      const { container } = render(
        <ResultCard
          title="Test"
          content="This is **bold text** in a sentence"
          icon="✓"
          variant="translation"
        />,
      );

      const strong = container.querySelector('strong');
      expect(strong).toBeInTheDocument();
      expect(strong?.textContent).toBe('bold text');
    });

    it('should render italic text', () => {
      const { container } = render(
        <ResultCard
          title="Test"
          content="This is *italic text* in a sentence"
          icon="✓"
          variant="translation"
        />,
      );

      const em = container.querySelector('em');
      expect(em).toBeInTheDocument();
      expect(em?.textContent).toBe('italic text');
    });

    it('should render bullet lists', () => {
      const content = `Tips:
- First tip
- Second tip
- Third tip`;

      const { container } = render(
        <ResultCard title="Test" content={content} icon="✓" variant="tips" />,
      );

      const ul = container.querySelector('ul');
      expect(ul).toBeInTheDocument();

      const items = container.querySelectorAll('li');
      expect(items).toHaveLength(3);
      expect(items[0].textContent).toBe('First tip');
      expect(items[1].textContent).toBe('Second tip');
      expect(items[2].textContent).toBe('Third tip');
    });

    it('should render numbered lists', () => {
      const content = `Steps:
1. First step
2. Second step
3. Third step`;

      const { container } = render(
        <ResultCard title="Test" content={content} icon="✓" variant="grammar" />,
      );

      const ol = container.querySelector('ol');
      expect(ol).toBeInTheDocument();

      const items = container.querySelectorAll('li');
      expect(items).toHaveLength(3);
      expect(items[0].textContent).toBe('First step');
      expect(items[1].textContent).toBe('Second step');
      expect(items[2].textContent).toBe('Third step');
    });

    it('should NOT render inline code (disallowed)', () => {
      const { container } = render(
        <ResultCard
          title="Test"
          content="This has `inline code` which should not render as code"
          icon="✓"
          variant="translation"
        />,
      );

      const code = container.querySelector('code');
      expect(code).not.toBeInTheDocument();

      // Should render as plain text
      expect(screen.getByText(/inline code/)).toBeInTheDocument();
    });

    it('should NOT render links (disallowed)', () => {
      const { container } = render(
        <ResultCard
          title="Test"
          content="This has [a link](https://example.com) which should not render as a link"
          icon="✓"
          variant="translation"
        />,
      );

      const link = container.querySelector('a');
      expect(link).not.toBeInTheDocument();

      // Should render as plain text
      expect(screen.getByText(/a link/)).toBeInTheDocument();
    });

    it('should render combined markdown features', () => {
      const content = `This is **bold** and *italic* text.

- First item with **bold**
- Second item with *italic*

Done!`;

      const { container } = render(
        <ResultCard title="Test" content={content} icon="✓" variant="tips" />,
      );

      expect(container.querySelector('strong')).toBeInTheDocument();
      expect(container.querySelector('em')).toBeInTheDocument();
      expect(container.querySelector('ul')).toBeInTheDocument();
      expect(container.querySelectorAll('li')).toHaveLength(2);
    });
  });
});
