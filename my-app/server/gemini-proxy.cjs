#!/usr/bin/env node
const path = require('path');
const appRoot = path.join(__dirname, '..');
// Load .env then .env.local (local overrides); try both so key works from either file
require('dotenv').config({ path: path.join(appRoot, '.env') });
require('dotenv').config({ path: path.join(appRoot, '.env.local'), override: true });

const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

const PORT = process.env.PORT || 5174;
// Trim and strip BOM so key from file is valid
const GEMINI_KEY = (process.env.GEMINI_API_KEY || '').replace(/^\uFEFF/, '').trim();
if (!GEMINI_KEY) {
  console.warn('Warning: GEMINI_API_KEY not set. Check my-app/.env.local (or .env) and restart the proxy.');
} else {
  console.log('GEMINI_API_KEY loaded (%d chars).', GEMINI_KEY.length);
}

app.post('/api/gemini', async (req, res) => {
  if (!GEMINI_KEY) return res.status(500).json({ error: 'Server misconfigured: GEMINI_API_KEY missing' });
  try {
    const { model, system, prompt, responseMimeType, maxTokens, imageData } = req.body;
    // Gemini API: support both header and query key (some setups require query param)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;
    // Build parts array — add image inline data if provided
    const parts = [{ text: system ? `${system}\n\n${prompt}` : prompt }];
    if (imageData && imageData.base64 && imageData.mimeType) {
      parts.push({ inline_data: { mime_type: imageData.mimeType, data: imageData.base64 } });
    }
    const requestBody = {
      contents: [{
        role: 'user',
        parts
      }],
      generationConfig: {
        temperature: 0.2,
        max_output_tokens: maxTokens || 2048,
        ...(responseMimeType && { response_mime_type: responseMimeType })
      }
    };
    if (system) {
      requestBody.systemInstruction = { parts: [{ text: system }] };
      requestBody.contents[0].parts[0].text = prompt;
    }

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_KEY  // key also in URL for compatibility
      },
      body: JSON.stringify(requestBody)
    });
    if (!r.ok) {
      const errBody = await r.text().catch(() => null);
      let errMessage = `Gemini error: ${r.status} ${errBody}`;
      try {
        const errJson = errBody ? JSON.parse(errBody) : null;
        if (errJson?.error?.message) errMessage = errJson.error.message;
      } catch (_) {}
      return res.status(r.status).json({ error: errMessage });
    }
    const data = await r.json();
    let text = '';
    if (data?.candidates?.[0]?.content?.parts) {
      text = data.candidates[0].content.parts.map(p => p.text || '').join('');
    } else {
      text = JSON.stringify(data);
    }
    return res.json({ text, raw: data });
  } catch (e) {
    console.error('Proxy error', e);
    return res.status(500).json({ error: e.message });
  }
});

if (process.env.STATIC_SERVE) {
  const dist = path.join(__dirname, '..', 'dist');
  app.use(express.static(dist));
  app.get('*', (req,res)=>res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, ()=>console.log(`Gemini proxy running on http://localhost:${PORT}`));
