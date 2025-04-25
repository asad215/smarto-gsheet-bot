
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Sample FAQs - replace this with dynamic fetch from Google Sheets if needed
const faqs = [
  { question: "What is Smarto.Space?", answer: "Smarto.Space is an AI automation platform for businesses." },
  { question: "Who is James?", answer: "James is the 24/7 AI chatbot assistant for Smarto.Space." },
  { question: "Do you offer a free trial?", answer: "Yes, we offer a 1-day free trial with no payment required." }
];

function getFAQAnswer(userMessage) {
  const found = faqs.find(faq =>
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
