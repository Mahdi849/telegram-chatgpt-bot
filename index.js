require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const nlp = require('compromise');

const bot = new Telegraf(process.env.BOT_TOKEN);

// حافظه جدا برای هر چت
const conversations = new Map();

// اسم نمایشی
const FAKE_MODEL_NAME = 'GPT-5.2';

/* ---------- Escape HTML ---------- */
function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ---------- بولد هوشمند اسم برنامه‌ها ---------- */
function boldDetectedApps(text) {
  const doc = nlp(text);
  const names = doc.nouns().isProper().out('array');

  names.forEach(name => {
    const safe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${safe}\\b`, 'g');
    text = text.replace(regex, `<b>${name}</b>`);
  });

  return text;
}

/* ---------- کیبورد پایین (فقط منو) ---------- */
function bottomMenu() {
  return {
    reply_markup: {
      keyboard: [[{ text: '☰ منو' }]],
      resize_keyboard: true
    }
  };
}

/* ---------- منوی روی پیام ---------- */
function inlineMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🤖 مدل فعلی', callback_data: 'current_model' }],
        [{ text: 'ℹ️ درباره', callback_data: 'about' }]
      ]
    }
  };
}

/* ---------- start ---------- */
bot.start((ctx) => {
  const chatId = ctx.chat.id;
  conversations.delete(chatId); // ریست حافظه

  ctx.reply(
    'سلام 👋\nمن ChatGPT هستم (GPT-5.2)\nهر چی بپرسی جواب می‌دم 🤖✨',
    bottomMenu()
  );
});

/* ---------- دریافت پیام ---------- */
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;   // ✅ خیلی مهم
  const text = ctx.message.text;

  // منو
  if (text === '☰ منو') {
    return ctx.reply('📋 منوی اصلی', inlineMenu());
  }

  // حافظه چت
  if (!conversations.has(chatId)) {
    conversations.set(chatId, [
      {
        role: 'system',
        content:
          'تو یک هوش مصنوعی دقیق هستی. پاسخ‌ها روان باشند. ' +
          'نام برنامه‌ها و موارد مهم را بولد کن. ' +
          'اگر از مدلت پرسیدند بگو ChatGPT 5.2.'
      }
    ]);
  }

  const history = conversations.get(chatId);
  history.push({ role: 'user', content: text });

  try {
    await ctx.sendChatAction('typing');

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
        }
      }
    );

    let reply = res.data.choices[0].message.content;

    reply = escapeHTML(reply);
    reply = boldDetectedApps(reply);

    history.push({ role: 'assistant', content: reply });

    ctx.reply(`🤖 <b>GPT-5.2</b>\n\n${reply}`, {
      parse_mode: 'HTML'
    });

    // محدود کردن حافظه
    if (history.length > 30) {
      history.splice(1, 4);
    }

  } catch (err) {
    console.error(err.response?.data || err.message);
    ctx.reply('❌ خطا در ارتباط با هوش مصنوع');
  }
});

/* ---------- دکمه‌های منو ---------- */
bot.action('current_model', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(`🤖 مدل فعال: <b>${FAKE_MODEL_NAME}</b>`, {
    parse_mode: 'HTML'
  });
});

bot.action('about', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '🤖 ChatGPT\nهوش مصنوعی پاسخ‌گو\nنسخه سریع و هوشمند ✨'
  );
});

/* ---------- جلوگیری از کرش ---------- */
bot.catch((err) => {
  console.error('Bot error:', err);
});

/* ---------- اجرا ---------- */
bot.launch();
console.log('🤖 ChatGPT Bot is running');
