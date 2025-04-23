const express = require('express');
const axios = require('axios');
const path = require('path');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/share', async (req, res) => {
  const { link, token, appstate } = req.query;

  if (!link) return res.status(400).json({ error: 'Missing link' });

  if (token) {
    try {
      const url = `https://graph.facebook.com/me/feed?link=${encodeURIComponent(link)}&published=0&access_token=${token}`;
      const result = await axios.post(url);
      if (result.data?.id) return res.json({ success: true, method: 'token', id: result.data.id });
      return res.status(500).json({ error: 'Failed to share using token' });
    } catch (err) {
      return res.status(500).json({ error: err.response?.data?.error?.message || err.message });
    }
  }

  if (appstate) {
    try {
      const cookies = JSON.parse(decodeURIComponent(appstate));
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.setCookie(...cookies);
      await page.goto(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, { waitUntil: 'networkidle2' });
      await page.waitForSelector('button[name="__CONFIRM__"], div[aria-label="Post"]', { timeout: 10000 });
      await page.click('button[name="__CONFIRM__"], div[aria-label="Post"]');
      await browser.close();
      return res.json({ success: true, method: 'appstate' });
    } catch (err) {
      return res.status(500).json({ error: 'AppState failed: ' + err.message });
    }
  }

  return res.status(400).json({ error: 'Missing token or appstate' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
