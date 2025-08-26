require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;     // @username або -100...
const CHANNEL_LINK = process.env.CHANNEL_LINK; // https://t.me/username

if (!BOT_TOKEN || !CHANNEL_ID || !CHANNEL_LINK) {
  throw new Error('Заповніть BOT_TOKEN, CHANNEL_ID і CHANNEL_LINK у .env');
}

const bot = new Telegraf(BOT_TOKEN);

// ---- Дані матчів (приклад) ----
const matches = [
  {
    id: '1',
    teams: 'Карабах - Ференцварош',
    stadium: 'Стадіон, Країна',
    tournament: 'Змагання',
    time: '21:00',
    streamUrl: 'https://example.com/stream/1'
  },
  {
    id: '2',
    teams: 'Бенфіка - Фенербахче',
    stadium: 'Арена, Країна',
    tournament: 'Кубок',
    time: '19:30',
    streamUrl: 'https://example.com/stream/2'
  },
  {
    id: '3',
    teams: 'Брюгге - Рейнджерс',
    stadium: '',
    tournament: '',
    time: '',
    streamUrl: ''
  },
  {
    id: '4',
    teams: 'Копенгаген - Базель',
    stadium: '',
    tournament: '',
    time: '',
    streamUrl: ''
  },
  {
    id: '5',
    teams: 'Сельта - Бетіс',
    stadium: '',
    tournament: '',
    time: '',
    streamUrl: ''
  }
];

// ---- Перевірка підписки ----
async function isSubscribed(userId) {
  try {
    const m = await bot.telegram.getChatMember(CHANNEL_ID, userId);
    return ['member', 'administrator', 'creator'].includes(m.status);
  } catch (e) {
    return false;
  }
}

// ---- Хелпери ----
function matchMessage(m) {
  return [
    `1. ${m.teams}`,
    `2. ${m.stadium}`,
    `3. ${m.tournament}`,
    `4. ${m.time}`,
    ``,
    `(трансляція з'являється за 5 хвилин до гри)`
  ].join('\n');
}

function matchesKeyboard() {
  return Markup.inlineKeyboard(
    matches.map(m => [Markup.button.callback(m.teams, `match_${m.id}`)])
  );
}

async function showMatches(ctx) {
  return ctx.reply('Оберіть трансляцію:', matchesKeyboard());
}

function matchKeyboard(m) {
  return Markup.inlineKeyboard([
    [Markup.button.url('▶️ Дивитися матч', m.streamUrl)],
    [Markup.button.callback('⬅️ Повернутися', `back_to_matches`)]
  ]);
}

// ---- Команди ----
bot.start(async (ctx) => {
  const ok = await isSubscribed(ctx.from.id);

  if (!ok) {
    return ctx.reply(
      'Щоб користуватися ботом, підпишіться на наш канал:',
      Markup.inlineKeyboard([
        [Markup.button.url('🔗 Підписатися', CHANNEL_LINK)],
        [Markup.button.callback('✅ Перевірити підписку', 'check_sub')]
      ])
    );
  }

  return showMatches(ctx);
});

bot.command('matches', async (ctx) => showMatches(ctx));

// ---- Обробники кнопок ----
bot.action('check_sub', async (ctx) => {
  const ok = await isSubscribed(ctx.from.id);
  if (!ok) return ctx.answerCbQuery('❌ Ви ще не підписані', { show_alert: true });

  try { await ctx.deleteMessage(); } catch (_) {}
  await ctx.answerCbQuery('✅ Підписку підтверджено');
  return showMatches(ctx);
});

// Один хендлер для всіх матчів
bot.action(/^match_(.+)$/, async (ctx) => {
  const id = ctx.match[1];
  const m = matches.find(x => x.id === id);
  if (!m) return ctx.answerCbQuery('Матч не знайдено');

  try { await ctx.deleteMessage(); } catch (_) {}
  await ctx.answerCbQuery(); // прибираємо "годинник" на кнопці
  return ctx.reply(matchMessage(m), matchKeyboard(m));
});

// Обробка повернення
bot.action('back_to_matches', async (ctx) => {
  try { await ctx.deleteMessage(); } catch (_) {}
  return showMatches(ctx);
});

// ---- Глобальна обробка помилок ----
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('Сталася помилка. Спробуйте ще раз.');
});

// ---- Запуск ----
bot.launch().then(() => console.log('Bot started'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
