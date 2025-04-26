const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Load training FAQs from training.txt
const trainingData = fs.readFileSync('training.txt', 'utf-8').split('\n\n').map(pair => {
  const [question, answer] = pair.split('\n').map(line => line.trim());
  return { question, answer };
});

// Function to find FAQ answer
function getFAQAnswer(userMessage) {
  const found = trainingData.find(faq =>
    userMessage.toLowerCase().includes(faq.question.toLowerCase())
  );
  return found ? found.answer : null;
}

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  const faqAnswer = getFAQAnswer(userMessage);

  if (faqAnswer) {
    return res.json({ reply: faqAnswer });
  }

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: userMessage }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });

    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Error calling OpenAI:', error.message);
    res.status(500).json({ error: 'Failed to get response from OpenAI' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});