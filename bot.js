require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const cron = require('node-cron');
const fs = require('fs');

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
    teams: 'ЮКСА - Чорноморець',
    stadium: 'Ювелірний (Буча) 🇺🇦',
    tournament: 'Перша ліга України',
    time: '2025-08-290T13:00:00', // обов’язково у форматі ISO для Date
    streamUrl: 'https://k353.liveball.st/match/1400436'
  },
  {
    id: '2',
    teams: 'Кудрівка - Карпати',
    stadium: 'Оболонь Арена (Київ) 🇺🇦',
    tournament: 'УПЛ',
    time: '2025-08-29T18:00:00',
    streamUrl: 'https://k353.liveball.st/match/1391443'
  },
  {
    id: '3',
    teams: 'СК Полтава - Зоря',
    stadium: 'Lokomotyv Stadium (Полтава) 🇺🇦',
    tournament: 'УПЛ',
    time: '2025-08-29T15:30:00',
    streamUrl: 'https://k353.liveball.st/match/1391439'
  },
  {
    id: '4',
    teams: 'Лечче - Мілан',
    stadium: 'Стадіо Віа дель Маре (Лечче) 🇮🇹',
    tournament: 'Серія А',
    time: '2025-08-29T21:45:00',
    streamUrl: 'https://k353.liveball.st/match/1377879'
  },
  {
    id: '5',
    teams: '🟠⚫Жеребкування🟢⚪',
    stadium: 'Монако 🇲🇨',
    tournament: 'Ліга Європи та Ліга Конференцій',
    time: '2025-08-29T14:00:00',
    streamUrl: 'https://www.uefa.com/uefaeuropaleague/draws'
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
    `${m.teams}`,
    `🏟️ ${m.stadium}`,
    `🏆 ${m.tournament}`,
    `⌚ ${new Date(m.time).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`,
    ``,
    `⚠️(трансляція з'являється за 5 хвилин до гри)⚠️`
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
    [Markup.button.callback('⏰ Нагадати', `remind_${m.id}`)],
    [Markup.button.callback('⬅️ Повернутися', `back_to_matches`)]
  ]);
}

// ---- База нагадувань ----
let reminders = [];
const REMINDER_FILE = 'reminders.json';

if (fs.existsSync(REMINDER_FILE)) {
  reminders = JSON.parse(fs.readFileSync(REMINDER_FILE));
}

function saveReminders() {
  fs.writeFileSync(REMINDER_FILE, JSON.stringify(reminders));
}

function reminderTimeKeyboard(matchId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⏱ 5 хв', `setremind_${matchId}_5`)],
    [Markup.button.callback('⏱ 10 хв', `setremind_${matchId}_10`)],
    [Markup.button.callback('⏱ 15 хв', `setremind_${matchId}_15`)],
    [Markup.button.callback('⏱ 30 хв', `setremind_${matchId}_30`)]
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

// Відкриття конкретного матчу
bot.action(/^match_(.+)$/, async (ctx) => {
  const id = ctx.match[1];
  const m = matches.find(x => x.id === id);
  if (!m) return ctx.answerCbQuery('Матч не знайдено');

  try { await ctx.deleteMessage(); } catch (_) {}
  await ctx.answerCbQuery();
  return ctx.reply(matchMessage(m), matchKeyboard(m));
});

// Обробка нагадування (вибір часу)
bot.action(/^remind_(.+)$/, async (ctx) => {
  const matchId = ctx.match[1];
  await ctx.deleteMessage();
  return ctx.reply('Оберіть, за скільки хвилин нагадати:', reminderTimeKeyboard(matchId));
});

bot.action(/^setremind_(.+)_(\d+)$/, async (ctx) => {
  const matchId = ctx.match[1];
  const minutesBefore = parseInt(ctx.match[2]);
  const userId = ctx.from.id;

  const match = matches.find(m => m.id === matchId);
  if (!match) return ctx.answerCbQuery('Матч не знайдено');

  reminders.push({
    userId,
    matchId,
    matchTime: match.time,
    minutesBefore
  });
  saveReminders();

  await ctx.deleteMessage();
  return ctx.reply(`✅ Нагадування встановлено за ${minutesBefore} хв до матчу "${match.teams}"`);
});

// Повернення до списку матчів
bot.action('back_to_matches', async (ctx) => {
  try { await ctx.deleteMessage(); } catch (_) {}
  return showMatches(ctx);
});

// ---- Планувальник нагадувань ----
cron.schedule('* * * * *', () => {
  const now = new Date();
  reminders.forEach((r, index) => {
    const matchDate = new Date(r.matchTime);
    const diff = (matchDate - now) / 60000; // різниця у хвилинах
    if (diff <= r.minutesBefore && diff > r.minutesBefore - 1) {
      bot.telegram.sendMessage(r.userId,
        `⚽ Матч "${matches.find(m => m.id===r.matchId).teams}" починається через ${r.minutesBefore} хв!\n🏟️ ${matches.find(m => m.id===r.matchId).stadium}\n🏆 ${matches.find(m => m.id===r.matchId).tournament}\n⌚ ${new Date(matches.find(m => m.id===r.matchId).time).toLocaleTimeString('uk-UA', { hour:'2-digit', minute:'2-digit' })}\n▶️ Дивитися трансляцію: ${matches.find(m => m.id===r.matchId).streamUrl}`
      );
      reminders.splice(index, 1);
      saveReminders();
    }
  });
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
