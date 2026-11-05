// Minimal OpenAI Chat Completions client with streaming (Server-Sent Events).

export const DEFAULT_MODEL = 'gpt-5-mini';
const URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Stream a chat completion from OpenAI.
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {string} opts.model
 * @param {string} opts.system  system instruction
 * @param {{role:'user'|'assistant', text:string}[]} opts.history
 * @param {(chunk:string)=>void} opts.onChunk
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<string>} full text
 */
export async function streamChat({ apiKey, model, system, history, onChunk, signal }) {
  const body = {
    model: model || DEFAULT_MODEL,
    stream: true,
    messages: [
      { role: 'system', content: system },
      ...history.map((m) => ({ role: m.role, content: m.text })),
    ],
  };

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      msg = err?.error?.message || msg;
    } catch {
      /* ignore */
    }
    const e = new Error(msg);
    e.status = res.status;
    throw e;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const text = JSON.parse(data).choices?.[0]?.delta?.content;
        if (text) {
          full += text;
          onChunk(text);
        }
      } catch {
        /* partial / non-JSON line; ignore */
      }
    }
  }
  return full;
}
