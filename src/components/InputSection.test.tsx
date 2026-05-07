import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
      />
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
      />
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
      />
    );

    const button = screen.getByRole('button', { name: /Generar traducción/i });
    await user.click(button);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('should disable input and button when loading', () => {
    render(
      <InputSection
        value="Test"
        onChange={() => {}}
        onSubmit={() => {}}
        loading={true}
        error={null}
      />
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
      />
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
      />
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
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
