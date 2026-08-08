import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InputSection } from './InputSection';

describe('InputSection', () => {
  it('should render input field and button', () => {
    render(
      <InputSection
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
        loading={false}
        error={null}
        elapsedTime={null}
        showCompletion={false}
      />,
    );

    expect(screen.getByPlaceholderText(/Escribe una frase/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generar traducción/i })).toBeInTheDocument();
  });

  it('should call onChange when typing', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <InputSection
        value=""
        onChange={onChange}
        onSubmit={() => {}}
        loading={false}
        error={null}
        elapsedTime={null}
        showCompletion={false}
      />,
    );

    const input = screen.getByPlaceholderText(/Escribe una frase/i);
    await user.type(input, 'Hola');

    expect(onChange).toHaveBeenCalled();
  });

  it('should call onSubmit when button clicked', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <InputSection
        value="Test phrase"
        onChange={() => {}}
        onSubmit={onSubmit}
        loading={false}
        error={null}
        elapsedTime={null}
        showCompletion={false}
      />,
    );

    const button = screen.getByRole('button', { name: /Generar traducción/i });
    await user.click(button);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('should call onSubmit when Ctrl+Enter is pressed in the textarea', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <InputSection
        value="Test phrase"
        onChange={() => {}}
        onSubmit={onSubmit}
        loading={false}
        error={null}
        elapsedTime={null}
        showCompletion={false}
      />,
    );

    const input = screen.getByPlaceholderText(/Escribe una frase/i);
    input.focus();
    await user.keyboard('{Control>}{Enter}{/Control}');

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('should not call onSubmit when Enter is pressed without a modifier key', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <InputSection
        value="Test phrase"
        onChange={() => {}}
        onSubmit={onSubmit}
        loading={false}
        error={null}
        elapsedTime={null}
        showCompletion={false}
      />,
    );

    const input = screen.getByPlaceholderText(/Escribe una frase/i);
    input.focus();
    await user.keyboard('{Enter}');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should disable input and button when loading', () => {
    render(
      <InputSection
        value="Test"
        onChange={() => {}}
        onSubmit={() => {}}
        loading={true}
        error={null}
        elapsedTime={null}
        showCompletion={false}
      />,
    );

    const input = screen.getByPlaceholderText(/Escribe una frase/i);
    const button = screen.getByRole('button');

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('should show loading text when loading', () => {
    render(
      <InputSection
        value="Test"
        onChange={() => {}}
        onSubmit={() => {}}
        loading={true}
        error={null}
        elapsedTime={null}
        showCompletion={false}
      />,
    );

    expect(screen.getByText(/Traduciendo/i)).toBeInTheDocument();
  });

  it('should display error message when error exists', () => {
    render(
      <InputSection
        value="Test"
        onChange={() => {}}
        onSubmit={() => {}}
        loading={false}
        error="API error occurred"
        elapsedTime={null}
        showCompletion={false}
      />,
    );

    expect(screen.getByText(/API error occurred/i)).toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    render(
      <InputSection
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
        loading={true}
        error={null}
        elapsedTime={null}
        showCompletion={false}
      />,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  describe('Timer display on button', () => {
    it('should show elapsed time during loading', () => {
      render(
        <InputSection
          value="Test"
          onChange={() => {}}
          onSubmit={() => {}}
          loading={true}
          error={null}
          elapsedTime={2.3}
          showCompletion={false}
        />,
      );

      expect(screen.getByText(/Traduciendo\.\.\. 2\.3s/i)).toBeInTheDocument();
    });

    it('should show completion message with elapsed time', () => {
      render(
        <InputSection
          value="Test"
          onChange={() => {}}
          onSubmit={() => {}}
          loading={false}
          error={null}
          elapsedTime={3.7}
          showCompletion={true}
        />,
      );

      expect(screen.getByText(/Completado en 3\.7s/i)).toBeInTheDocument();
    });

    it('should show normal button text when not loading and not showing completion', () => {
      render(
        <InputSection
          value="Test"
          onChange={() => {}}
          onSubmit={() => {}}
          loading={false}
          error={null}
          elapsedTime={2.0}
          showCompletion={false}
        />,
      );

      expect(screen.getByText(/Generar traducción/i)).toBeInTheDocument();
    });

    it('should show "Traduciendo..." without time if elapsedTime is null', () => {
      render(
        <InputSection
          value="Test"
          onChange={() => {}}
          onSubmit={() => {}}
          loading={true}
          error={null}
          elapsedTime={null}
          showCompletion={false}
        />,
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/Traduciendo\.\.\./);
    });
  });
});
