const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PRIMARY_PROVIDERS = [
  { name: 'anthropic', url: 'https://api.anthropic.com/v1/messages', key: process.env.ANTHROPIC_API_KEY },
  { name: 'openai', url: 'https://api.openai.com/v1/chat/completions', key: process.env.OPENAI_API_KEY }
];

const FALLBACK_PROVIDER = {
  url: process.env.ROUTER_9_URL || 'https://r8tbf2p.abc-tunnel.us/v1',
  key: process.env.ROUTER_9_API_KEY
};

app.post('/v1/chat/completions', async (req, res) => {
  let lastError;
  
  // Coba provider utama (Anthropic/OpenAI)
  for (const provider of PRIMARY_PROVIDERS) {
    if (!provider.key) continue;
    try {
      const response = await axios.post(provider.url, req.body, {
        headers: { 'Authorization': `Bearer ${provider.key}` },
        timeout: 15000
      });
      return res.json(response.data);
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      // Jika rate limit (429) atau kuota habis (402), lanjut ke loop berikutnya / fallback
      if (status !== 429 && status !== 402) {
        // Jika error lain, langsung lempar atau lanjut
      }
    }
  }

  // Fallback ke 9router jika provider utama gagal/habis token
  try {
    const fallbackRes = await axios.post(FALLBACK_PROVIDER.url, req.body, {
      headers: { 'Authorization': `Bearer ${FALLBACK_PROVIDER.key}` }
    });
    return res.json(fallbackRes.data);
  } catch (err) {
    return res.status(500).json({ error: 'All providers failed', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
