require('dotenv').config();
const conversations = new Map();
const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);




// اسم فیک مدل (نمایشی 😁)
const FAKE_MODEL_NAME = 'GPT-5.2';

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
    'سلام 👋\nمن ChatGPT هستم (GPT-5.2)\nهر چی بپرسی جواب می‌دم 🤖✨',
    menuMarkup()
  );
});

/* ---------- دریافت پیام ---------- */
bot.on('text', async (ctx) => {
	await ctx.sendChatAction('typing'); // ⬅️ پیام در حال تایپ

  
  const userMessage = ctx.message.text;

  if (!conversations.has(chatId)) {
    conversations.set(chatId, [
      {
        role: 'system',
        content: ' و اتو یک هوش مصنوعی هستی که دقیق چت میکند و شوخ تبعی نمیکند پاسخ را روان و دقیق بده و کلمه های مهم را مثل نام برنامه و... را برای تلگرام بلد کن و اگر از مدلت پرسید بگو من مدل chatgpt 5.2 هستم'
      }
    ]);
  }

  

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

    ctx.reply(`🤖 GPT-5.2:\n\n${reply}`);

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




/* ---------- اجرا ---------- */
bot.launch();
console.log('🤖 ChatGPT Bot is running');
