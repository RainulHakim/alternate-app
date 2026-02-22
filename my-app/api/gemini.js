// Vercel serverless function — mirrors server/gemini-proxy.cjs for production
// GEMINI_API_KEY is set as an Environment Variable in the Vercel dashboard

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',   // allow base64 image uploads
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GEMINI_KEY = (process.env.GEMINI_API_KEY || '').replace(/^\uFEFF/, '').trim();
  if (!GEMINI_KEY) {
    return res.status(500).json({ error: 'Server misconfigured: GEMINI_API_KEY missing' });
  }

  try {
    const { model, system, prompt, responseMimeType, maxTokens, imageData } = req.body;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;

    // Build parts — add inline image data if provided
    const parts = [{ text: system ? `${system}\n\n${prompt}` : prompt }];
    if (imageData && imageData.base64 && imageData.mimeType) {
      parts.push({ inline_data: { mime_type: imageData.mimeType, data: imageData.base64 } });
    }

    const requestBody = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.2,
        max_output_tokens: maxTokens || 2048,
        ...(responseMimeType && { response_mime_type: responseMimeType }),
      },
    };

    if (system) {
      requestBody.systemInstruction = { parts: [{ text: system }] };
      requestBody.contents[0].parts[0].text = prompt;
    }

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_KEY,
      },
      body: JSON.stringify(requestBody),
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
    console.error('Gemini function error', e);
    return res.status(500).json({ error: e.message });
  }
}
