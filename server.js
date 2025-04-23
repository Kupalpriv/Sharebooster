const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/share', async (req, res) => {
  const { link, token } = req.query;
  if (!link || !token) return res.status(400).json({ error: 'Missing link or token' });

  try {
    const url = `https://graph.facebook.com/me/feed?link=${encodeURIComponent(link)}&published=0&access_token=${token}`;
    const result = await axios.post(url);
    if (result.data?.id) return res.json({ success: true, id: result.data.id });
    res.status(500).json({ error: 'Failed to share' });
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port);
