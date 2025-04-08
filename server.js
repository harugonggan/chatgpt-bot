const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const NAVER_AUTH = process.env.NAVER_AUTH;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/', async (req, res) => {
  const { event, user, text } = req.body;
  if (event !== 'send') return res.send('skip');

  const gptRes = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: text.content }]
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const reply = gptRes.data.choices[0].message.content;

  await axios.post(
    'https://messageapi.talk.naver.com/v2/send',
    {
      event: 'send',
      user,
      text: { content: reply }
    },
    {
      headers: {
        Authorization: NAVER_AUTH,
        'Content-Type': 'application/json'
      }
    }
  );

  res.send('ok');
});

app.listen(3000, () => console.log('Chatbot server is running'));