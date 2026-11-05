// Minimal Gemini REST client with streaming (Server-Sent Events).

export const DEFAULT_MODEL = 'gemini-3.8-flash';
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Stream a chat completion from Gemini.
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {string} opts.model
 * @param {string} opts.system  system instruction
 * @param {{role:'user'|'model', text:string}[]} opts.history
 * @param {(chunk:string)=>void} opts.onChunk
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<string>} full text
 */
export async function streamChat({ apiKey, model, system, history, onChunk, signal }) {
  const url = `${BASE}/${encodeURIComponent(model || DEFAULT_MODEL)}:streamGenerateContent?alt=sse`;
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
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
        const json = JSON.parse(data);
        const text = (json.candidates?.[0]?.content?.parts || [])
          .filter((p) => !p.thought)
          .map((p) => p.text || '')
          .join('');
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
