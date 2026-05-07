import { describe, it, expect, beforeEach, vi } from 'vitest';
import { translatePhrase } from './togetherApi';
import type { TogetherAIResponse } from '../types';

// Mock fetch globally
global.fetch = vi.fn();

describe('togetherApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully translate a Spanish phrase', async () => {
    const mockResponse: TogetherAIResponse = {
      id: 'test-id',
      choices: [{
        message: {
          role: 'assistant',
          content: `## Principal Translation
Hello

## Grammatical Analysis
Simple greeting

## Learning Key
Common phrase

## Technical Variations
Hi, Hey`
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await translatePhrase('Hola', 'test-api-key');

    expect(result).toBe(mockResponse.choices[0].message.content);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.together.xyz/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        })
      })
    );
  });

  it('should include correct prompt structure', async () => {
    const mockResponse: TogetherAIResponse = {
      id: 'test-id',
      choices: [{
        message: {
          role: 'assistant',
          content: 'Test response'
        },
        finish_reason: 'stop'
      }]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    await translatePhrase('¿Cómo estás?', 'test-api-key');

    const fetchCall = (global.fetch as any).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);

    expect(requestBody.model).toBe('meta-llama/Llama-3.3-70B-Instruct-Turbo');
    expect(requestBody.messages).toHaveLength(2);
    expect(requestBody.messages[0].role).toBe('system');
    expect(requestBody.messages[1].role).toBe('user');
    expect(requestBody.messages[1].content).toContain('¿Cómo estás?');
  });

  it('should handle network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(translatePhrase('Hola', 'test-api-key')).rejects.toThrow('Network error. Please check your connection and try again.');
  });

  it('should handle API errors with status codes', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    });

    await expect(translatePhrase('Hola', 'test-api-key')).rejects.toThrow('API error: 401 Unauthorized');
  });

  it('should handle rate limit errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests'
    });

    await expect(translatePhrase('Hola', 'test-api-key')).rejects.toThrow('Rate limit exceeded. Please wait a moment and try again.');
  });

  it('should handle malformed API responses', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        // Missing choices array
        id: 'test-id'
      })
    });

    await expect(translatePhrase('Hola', 'test-api-key')).rejects.toThrow('Invalid response from API');
  });

  it('should handle empty Spanish phrase', async () => {
    await expect(translatePhrase('')).rejects.toThrow('Spanish phrase cannot be empty');
  });

  it('should handle whitespace-only input', async () => {
    await expect(translatePhrase('   ')).rejects.toThrow('Spanish phrase cannot be empty');
  });

  it('should include API key in headers', async () => {
    const mockResponse: TogetherAIResponse = {
      id: 'test-id',
      choices: [{
        message: {
          role: 'assistant',
          content: 'Test'
        },
        finish_reason: 'stop'
      }]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    await translatePhrase('Test', 'test-api-key');

    const fetchCall = (global.fetch as any).mock.calls[0];
    const headers = fetchCall[1].headers;

    // API key should be included
    expect(headers['Authorization']).toBe('Bearer test-api-key');
  });
});
