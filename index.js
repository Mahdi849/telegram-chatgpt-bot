require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);

// حافظه جدا برای هر چت
const conversations = new Map();

// اسم نمایشی مدل 😁
const FAKE_MODEL_NAME = 'GPT-4';

/* ---------- منوی اصلی ---------- */
function menuMarkup() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🤖 مدل فعلی', callback_data: 'current_model' }],
        [{ text: 'ℹ️ درباره ربات', callback_data: 'about' }],
        [{ text: '🗑 پاک کردن گفتگو', callback_data: 'clear_chat' }]
      ]
    }
  };
}

/* ---------- start ---------- */
bot.start((ctx) => {
  ctx.reply(
    'سلام 👋\nمن ChatGPT هستم 🤖\nهر چی بپرسی جواب می‌دم ✨',
    menuMarkup()
  );
});

/* ---------- دریافت پیام ---------- */
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const userMessage = ctx.message.text;

  // تایپینگ
  await ctx.sendChatAction('typing');

  // ساخت حافظه اگر نبود
  if (!conversations.has(chatId)) {
    conversations.set(chatId, [
      {
        role: 'system',
        content:
          'تو یک هوش مصنوعی فارسی‌زبان هستی. پاسخ‌ها دقیق، روان و فارسی باشند.'
      }
    ]);
  }

  const history = conversations.get(chatId);
  history.push({ role: 'user', content: userMessage });

  try {
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: history
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // جلوگیری از هنگ روی سرور
      }
    );

    const reply = res.data.choices[0].message.content;

    history.push({ role: 'assistant', content: reply });

    await ctx.reply(`🤖 GPT-4:\n\n${reply}`, menuMarkup());

    // کنترل حجم حافظه
    if (history.length > 20) {
      history.splice(1, 4);
    }

  } catch (err) {
    console.error('AI ERROR:', err.response?.data || err.message);
    ctx.reply('❌ خطا در ارتباط با هوش مصنوع');
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
    '🤖 ربات ChatGPT\n' +
    'نسخه سریع و هوشمند\n' +
    'حافظه جدا برای هر چت ✨'
  );
});

/* ---------- پاک کردن حافظه ---------- */
bot.action('clear_chat', (ctx) => {
  conversations.delete(ctx.chat.id);
  ctx.answerCbQuery();
  ctx.reply('🗑 حافظه این چت پاک شد');
});

/* ---------- اجرا ---------- */
bot.launch()
  .then(() => console.log('🤖 Bot is running on server'))
  .catch(err => console.error('BOT ERROR:', err));

// مخصوص Render
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
