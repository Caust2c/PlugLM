/**
 * OpenRouter API integration for PlugLM
 * Handles sending chat messages to the OpenRouter API.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const DEFAULT_MODEL = 'minimax/minimax-m2.5:free';

/**
 * Send messages to OpenRouter and return the assistant response.
 *
 * @param {string} apiKey - The OpenRouter API key
 * @param {Array<{role: string, content: string}>} messages - Full conversation history
 * @param {string} [model] - Model identifier (defaults to DEFAULT_MODEL)
 * @param {AbortSignal} [signal] - Optional AbortController signal for cancellation
 * @returns {Promise<string>} The assistant's reply content
 */
export async function sendChatMessage(apiKey, messages, model = DEFAULT_MODEL, signal) {
  if (!apiKey) {
    throw new Error('API key is required. Please set your OpenRouter API key in Settings.');
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'PlugLM',
    },
    body: JSON.stringify({
      model,
      messages,
    }),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage;
    try {
      const parsed = JSON.parse(errorBody);
      errorMessage = parsed.error?.message || parsed.message || errorBody;
    } catch {
      errorMessage = errorBody;
    }
    throw new Error(`API Error (${response.status}): ${errorMessage}`);
  }

  const data = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response received from the model.');
  }

  return data.choices[0].message.content;
}
