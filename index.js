require('dotenv').config();
const conversations = new Map();
const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);

conversations.get(chatId)
conversations.set(chatId, ...)
conversations.delete(chatId)


// اسم فیک مدل (نمایشی 😁)
const FAKE_MODEL_NAME = 'GPT-4';

/* ---------- منوی اصلی ---------- */
function menuMarkup() {
  return {
    reply_markup: {
      inline_keyboard: [
	    
        [{ text: '🤖 مدل فعلی', callback_data: 'current_model' }],
        [{ text: 'ℹ️ درباره ChatGPT', callback_data: 'about' }]
		[{ text: '🗑 پاک کردن گفتگو', callback_data: 'clear_chat' }]
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
	await ctx.sendChatAction('typing'); // ⬅️ پیام در حال تایپ

  const chatId = ctx.chat.id;
  const userMessage = ctx.message.text;

  if (!conversations.has(chatId)) {
    conversations.set(chatId, [
      {
        role: 'system',
        content: `
تو یک هوش مصنوعی فارسی‌زبان هستی.
حافظه این گفتگو فقط مخصوص همین چت است.
پاسخ‌ها را دقیق، روان و فارسی بده.
`
      }
    ]);
  }

  const history = conversations.get(chatId);

  history.push({ role: 'user', content: userMessage });

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

    const reply = res.data.choices[0].message.content;

    history.push({ role: 'assistant', content: reply });

    ctx.reply(`🤖 GPT-4:\n\n${reply}`);

    if (history.length > 30) {
      history.splice(1, 4);
    }

  } catch (err) {
    console.error(err.response?.data || err.message);
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
    '🤖 ChatGPT (GPT-4)\n' +
    'هوش مصنوعی برای پاسخ‌گویی به سوالات شما\n' +
    'نسخه سریع و هوشمند ✨'
  );
});

bot.action('clear_chat', (ctx) => {
  conversations.delete(ctx.chat.id);
  ctx.answerCbQuery();
  ctx.reply('🗑 حافظه این چت پاک شد');
});


/* ---------- اجرا ---------- */
bot.launch();
console.log('🤖 ChatGPT Bot is gogogoing');
