require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);

// اسم فیک مدل (نمایشی 😁)
const FAKE_MODEL_NAME = 'GPT-4';

/* ---------- منوی اصلی ---------- */
function menuMarkup() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🤖 مدل فعلی', callback_data: 'current_model' }],
        [{ text: 'ℹ️ درباره ChatGPT', callback_data: 'about' }]
      ]
    }
  };
}

/* ---------- start ---------- */
bot.start((ctx) => {
  ctx.reply(
    'سلام 👋\nمن ChatGPT هستم (GPT-4)\nهر چی بپرسی جواب می‌دم 🤖✨',
    menuMarkup()
  );
});

/* ---------- دریافت پیام ---------- */
bot.on('text', async (ctx) => {
  try {
    // حالت تایپ (GPTیگی 😁)
    await ctx.sendChatAction('typing');

    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant', // ← اصل کار (رایگان)
        messages: [
          {
            role: 'system',
            content: 'You are ChatGPT, a helpful and smart AI assistant.'
          },
          {
            role: 'user',
            content: ctx.message.text
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = res.data.choices[0].message.content;

    ctx.reply(
      `🤖 ${FAKE_MODEL_NAME}:\n\n${reply}`,
      menuMarkup()
    );

  } catch (err) {
    console.error(err.response?.data || err.message);
    ctx.reply('❌ خطا در ارتباط با ChatGPT');
  }
});

/* ---------- مدل فعلی ---------- */
bot.action('current_model', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply(`🤖 مدل فعال: ${FAKE_MODEL_NAME}`);
});

/* ---------- درباره ---------- */
bot.action('about', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply(
    '🤖 ChatGPT (GPT-4)\n' +
    'هوش مصنوعی برای پاسخ‌گویی به سوالات شما\n' +
    'نسخه سریع و هوشمند ✨'
  );
});

/* ---------- اجرا ---------- */
bot.launch();
console.log('🤖 ChatGPT Bot is running...');
