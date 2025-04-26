process.env.TZ = 'UTC';
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Load training text
let trainingData = '';
try {
  trainingData = fs.readFileSync('training.txt', 'utf-8');
} catch (error) {
  console.error('Error loading training.txt:', error.message);
}

// Smarter Helper function to find FAQ answer
function getFAQAnswer(userMessage) {
  const lines = trainingData.split('\n\n');
  userMessage = userMessage.toLowerCase().trim();

  for (const line of lines) {
    const [question, answer] = line.split('\n').map(l => l.trim());
    if (question && answer) {
      const questionKeywords = question.toLowerCase().split(' ').filter(w => w.length > 2);
      const matchCount = questionKeywords.filter(word => userMessage.includes(word)).length;
      if (matchCount >= Math.floor(questionKeywords.length / 2)) {
        return answer;
      }
    }
  }
  return null;
}

// Chat endpoint
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  const faqAnswer = getFAQAnswer(userMessage);

  if (faqAnswer) {
    return res.json({ reply: faqAnswer });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: userMessage }]
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
