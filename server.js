const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Setup Google Sheets API with credentials.json
const auth = new GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = '1DBsMpAQuvqJfd2_lrnzlwZSW4lllFf4dYbD2ABZ0qvY'; // your sheet ID
const RANGE = 'Smarto FAQs'!A:B;
let faqs = [ ];

// Load FAQs from Google Sheets
async function fetchFAQs() {
  try {
    const client = await auth.getClient();
    const sheetsClient = google.sheets({ version: 'v4', auth: client });
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });
    return response.data.values || [];
  } catch (error) {
    console.error('Error fetching FAQs from Google Sheets:', error.message);
    return [];
  }
}

// Fetch once at startup
async function loadFAQs() {
  faqs = await fetchFAQs();
}
loadFAQs();

// Find matching FAQ answer
function getFAQAnswer(userMessage) {
  const found = faqs.find(faq =>
    userMessage.toLowerCase().includes(faq[0]?.toLowerCase())
  );
  return found ? found[1] : null;
}

// Chat endpoint
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  const faqAnswer = getFAQAnswer(userMessage);

  if (faqAnswer) {
    return res.json({ reply: faqAnswer });
  }

  // Fallback to GPT if no FAQ match
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: userMessage }
        ]
      })
    });

    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error('Error calling OpenAI:', error.message);
    res.status(500).json({ error: 'Failed to get response from OpenAI' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
