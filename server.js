const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// 환경 변수에서 키 불러오기
const NAVER_AUTH = process.env.NAVER_AUTH;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Naver Webhook 엔드포인트
app.post('/naver', async (req, res) => {
  console.log('[Webhook] 요청 도착:', req.body);

  try {
    const { event, user, textContent } = req.body;

    if (event !== 'send') {
      return res.send('skip'); // 메시지 이벤트가 아닐 경우 무시
    }

    const userMessage = textContent?.text || '';

    // GPT에게 메시지 전달
    const gptRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: userMessage }]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = gptRes.data.choices[0].message.content;

    // Naver에 응답 보내기
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
  } catch (err) {
    console.error('[에러 발생]', err.response?.data || err.message);
    res.status(500).send('error');
  }
});

// 서버 실행
app.listen(3000, () => console.log('✅ Chatbot server is running on port 3000'));
