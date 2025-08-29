require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const cron = require("node-cron");
const fs = require("fs");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID; // @username або -100...
const CHANNEL_LINK = process.env.CHANNEL_LINK; // https://t.me/username

if (!BOT_TOKEN || !CHANNEL_ID || !CHANNEL_LINK) {
  throw new Error("Заповніть BOT_TOKEN, CHANNEL_ID і CHANNEL_LINK у .env");
}

const bot = new Telegraf(BOT_TOKEN);

// ---- Дані матчів ----
const matches = [
  {
    id: "1",
    teams: "Челсі - Фулгем",
    stadium: "Стемфорд Брідж (Лондон) 🇬🇧",
    tournament: "Прем'єр-ліга",
    time: "2025-08-30T14:30:00",
    streamUrl: "https://k354.liveball.st/match/1378991",
  },
  {
    id: "2",
    teams: "Вулвергемптон - Евертон",
    stadium: "Моліньє (Вулвергемптон) 🇬🇧",
    tournament: "Прем'єр-ліга",
    time: "2025-08-30T17:00:00",
    streamUrl: "https://k354.liveball.st/match/1378998",
  },
  {
    id: "3",
    teams: "Манчестер Юнайтед - Бернлі",
    stadium: "Олд Траффорд (Манчестер) 🇬🇧",
    tournament: "Прем'єр-ліга",
    time: "2025-08-30T17:00:00",
    streamUrl: "https://k354.liveball.st/match/1378994",
  },
  {
    id: "4",
    teams: "Сандерленд - Брентфорд",
    stadium: "Стедіум оф Лайт (Сандерленд) 🇬🇧",
    tournament: "Прем'єр-ліга",
    time: "2025-08-30T17:00:00",
    streamUrl: "https://k354.liveball.st/match/1378996",
  },
  {
    id: "5",
    teams: "Тоттенгем - Борнмут",
    stadium: "Тоттенгем Хотспур (Лондон) 🇬🇧",
    tournament: "Прем'єр-ліга",
    time: "2025-08-30T17:00:00",
    streamUrl: "https://k354.liveball.st/match/1378997",
  },
  {
    id: "6",
    teams: "Лідс - Ньюкасл Юнайтед",
    stadium: "Елланд Роуд (Лідс) 🇬🇧",
    tournament: "Прем'єр-ліга",
    time: "2025-08-30T19:30:00",
    streamUrl: "https://k354.liveball.st/match/1378992",
  },
  {
    id: "7",
    teams: "Алавес - Атлетіко",
    stadium: "Мендісорроса (Віторія-Гастейс) 🇪🇸",
    tournament: "ЛаЛіга",
    time: "2025-08-30T18:00:00",
    streamUrl: "https://k354.liveball.st/match/1390839",
  },
  {
    id: "8",
    teams: "Реал Ов’єдо - Реал Сосьєдад",
    stadium: "Карлос Тарт’єре (Овʼєдо) 🇪🇸",
    tournament: "ЛаЛіга",
    time: "2025-08-30T20:30:00",
    streamUrl: "https://k354.liveball.st/match/1390847",
  },
  {
    id: "9",
    teams: "Жирона - Севілья",
    stadium: "Мунтіліві (Жирона) 🇪🇸",
    tournament: "ЛаЛіга",
    time: "2025-08-30T20:30:00",
    streamUrl: "https://k354.liveball.st/match/1390844",
  },
  {
    id: "10",
    teams: "Реал Мадрид - Мальорка",
    stadium: "Сантьяго Бернабеу (Мадрид) 🇪🇸",
    tournament: "ЛаЛіга",
    time: "2025-08-30T22:30:00",
    streamUrl: "https://k354.liveball.st/match/1390846",
  },
  {
    id: "11",
    teams: "Болонья - Комо",
    stadium: "Ренато Даль-Ара (Болонья) 🇮🇹",
    tournament: "Серія A",
    time: "2025-08-30T19:30:00",
    streamUrl: "https://k354.liveball.st/match/1377874",
  },
  {
    id: "12",
    teams: "Парма - Аталанта",
    stadium: "Енніо Тардіні (Парма) 🇮🇹",
    tournament: "Серія A",
    time: "2025-08-30T19:30:00",
    streamUrl: "https://k354.liveball.st/match/1377881",
  },
  {
    id: "13",
    teams: "Наполі - Кальярі",
    stadium: "Дієго Армандо Марадона (Неаполь) 🇮🇹",
    tournament: "Серія A",
    time: "2025-08-30T21:45:00",
    streamUrl: "https://k354.liveball.st/match/1377880",
  },
  {
    id: "14",
    teams: "Піза - Рома",
    stadium: "Арена Гарібальді (Піза) 🇮🇹",
    tournament: "Серія A",
    time: "2025-08-30T21:45:00",
    streamUrl: "https://k354.liveball.st/match/1377882",
  },
  {
    id: "15",
    teams: "Вердер Бремен - Байєр Леверкузен",
    stadium: "Везерштадіон (Бремен) 🇩🇪",
    tournament: "Бундесліга",
    time: "2025-08-30T16:30:00",
    streamUrl: "https://k354.liveball.st/match/1388324",
  },
  {
    id: "16",
    teams: "Гоффенгайм - Айнтрахт Франкфурт",
    stadium: "ПройЗеро Арена (Зінсгайм) 🇩🇪",
    tournament: "Бундесліга",
    time: "2025-08-30T16:30:00",
    streamUrl: "https://k354.liveball.st/match/1388321",
  },
  {
    id: "17",
    teams: "РБ Лейпциг - Гайденгайм",
    stadium: "Ред Булл Арена (Лейпциг) 🇩🇪",
    tournament: "Бундесліга",
    time: "2025-08-30T16:30:00",
    streamUrl: "https://k354.liveball.st/match/1388322",
  },
  {
    id: "18",
    teams: "Штутгарт - Боруссія М.",
    stadium: "Мерседес-Бенц Арена (Штутгарт) 🇩🇪",
    tournament: "Бундесліга",
    time: "2025-08-30T16:30:00",
    streamUrl: "https://k354.liveball.st/match/1388323",
  },
  {
    id: "19",
    teams: "Аугсбург - Баварія Мюнхен",
    stadium: "WWK Арена (Аугсбург) 🇩🇪",
    tournament: "Бундесліга",
    time: "2025-08-30T19:30:00",
    streamUrl: "https://k354.liveball.st/match/1388317",
  },
  {
    id: "20",
    teams: "Лорьян - Лілль",
    stadium: "Стад дю Мустуар (Лорьян) 🇫🇷",
    tournament: "Ліга 1",
    time: "2025-08-30T18:00:00",
    streamUrl: "https://k354.liveball.st/match/1387719",
  },
  {
    id: "21",
    teams: "Нант - Осер",
    stadium: "Стад де ла Божуар (Нант) 🇫🇷",
    tournament: "Ліга 1",
    time: "2025-08-30T20:00:00",
    streamUrl: "https://k354.liveball.st/match/1387722",
  },
  {
    id: "22",
    teams: "Тулуза - ПСЖ",
    stadium: "Стадіон де Тулуз (Тулуза) 🇫🇷",
    tournament: "Ліга 1",
    time: "2025-08-30T22:05:00",
    streamUrl: "https://k354.liveball.st/match/1387724",
  },
];

// ---- Перевірка підписки ----
async function isSubscribed(userId) {
  try {
    const m = await bot.telegram.getChatMember(CHANNEL_ID, userId);
    return ["member", "administrator", "creator"].includes(m.status);
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
    `⌚ ${new Date(m.time).toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    ``,
    `⚠️(трансляція з'являється за 5 хвилин до гри)⚠️`,
  ].join("\n");
}

function leaguesKeyboard() {
  const leaguesOrder = [
    "Прем'єр-ліга",
    "ЛаЛіга",
    "Серія A",
    "Бундесліга",
    "Ліга 1",
  ];
  const leagues = [...new Set(matches.map((m) => m.tournament))];
  const sorted = leaguesOrder.filter((l) => leagues.includes(l));
  return Markup.inlineKeyboard(
    sorted.map((l) => [Markup.button.callback(l, `league_${l}`)])
  );
}

async function showLeagues(ctx) {
  return ctx.reply("Оберіть лігу:", leaguesKeyboard());
}

function matchesKeyboard(tournament) {
  return Markup.inlineKeyboard([
    ...matches
      .filter((m) => m.tournament === tournament)
      .map((m) => [Markup.button.callback(m.teams, `match_${m.id}`)]),
    [Markup.button.callback("⬅️ Назад до ліг", "back_to_leagues")],
  ]);
}

async function showMatches(ctx, tournament) {
  return ctx.reply(
    `Оберіть матч (${tournament}):`,
    matchesKeyboard(tournament)
  );
}

function matchKeyboard(m) {
  return Markup.inlineKeyboard([
    [Markup.button.url("▶️ Дивитися матч", m.streamUrl)],
    [Markup.button.callback("⏰ Нагадати", `remind_${m.id}`)],
    [Markup.button.callback("⬅️ Повернутися", `back_to_leagues`)],
  ]);
}

// ---- База нагадувань ----
let reminders = [];
const REMINDER_FILE = "reminders.json";

if (fs.existsSync(REMINDER_FILE)) {
  reminders = JSON.parse(fs.readFileSync(REMINDER_FILE));
}

function saveReminders() {
  fs.writeFileSync(REMINDER_FILE, JSON.stringify(reminders));
}

function reminderTimeKeyboard(matchId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback("⏱ 5 хв", `setremind_${matchId}_5`)],
    [Markup.button.callback("⏱ 10 хв", `setremind_${matchId}_10`)],
    [Markup.button.callback("⏱ 15 хв", `setremind_${matchId}_15`)],
    [Markup.button.callback("⏱ 30 хв", `setremind_${matchId}_30`)],
  ]);
}

// ---- Команди ----
bot.start(async (ctx) => {
  const ok = await isSubscribed(ctx.from.id);

  if (!ok) {
    return ctx.reply(
      "Щоб користуватися ботом, підпишіться на наш канал:",
      Markup.inlineKeyboard([
        [Markup.button.url("🔗 Підписатися", CHANNEL_LINK)],
        [Markup.button.callback("✅ Перевірити підписку", "check_sub")],
      ])
    );
  }

  return showLeagues(ctx);
});

bot.command("matches", async (ctx) => showLeagues(ctx));

// ---- Обробники кнопок ----
bot.action("check_sub", async (ctx) => {
  const ok = await isSubscribed(ctx.from.id);
  if (!ok)
    return ctx.answerCbQuery("❌ Ви ще не підписані", { show_alert: true });

  try {
    await ctx.deleteMessage();
  } catch (_) {}
  await ctx.answerCbQuery("✅ Підписку підтверджено");
  return showLeagues(ctx);
});

// Вибір ліги
bot.action(/^league_(.+)$/, async (ctx) => {
  const league = ctx.match[1];
  try {
    await ctx.deleteMessage();
  } catch (_) {}
  return showMatches(ctx, league);
});

// Вибір матчу
bot.action(/^match_(.+)$/, async (ctx) => {
  const id = ctx.match[1];
  const m = matches.find((x) => x.id === id);
  if (!m) return ctx.answerCbQuery("Матч не знайдено");

  try {
    await ctx.deleteMessage();
  } catch (_) {}
  await ctx.answerCbQuery();
  return ctx.reply(matchMessage(m), matchKeyboard(m));
});

// Обробка нагадування (вибір часу)
bot.action(/^remind_(.+)$/, async (ctx) => {
  const matchId = ctx.match[1];
  await ctx.deleteMessage();
  return ctx.reply(
    "Оберіть, за скільки хвилин нагадати:",
    reminderTimeKeyboard(matchId)
  );
});

bot.action(/^setremind_(.+)_(\d+)$/, async (ctx) => {
  const matchId = ctx.match[1];
  const minutesBefore = parseInt(ctx.match[2]);
  const userId = ctx.from.id;

  const match = matches.find((m) => m.id === matchId);
  if (!match) return ctx.answerCbQuery("Матч не знайдено");

  reminders.push({
    userId,
    matchId,
    matchTime: match.time,
    minutesBefore,
  });
  saveReminders();

  await ctx.deleteMessage();
  return ctx.reply(
    `✅ Нагадування встановлено за ${minutesBefore} хв до матчу "${match.teams}"`
  );
});

// Повернення до ліг
bot.action("back_to_leagues", async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (_) {}
  return showLeagues(ctx);
});

// ---- Планувальник нагадувань ----
cron.schedule("* * * * *", () => {
  const now = new Date();
  reminders.forEach((r, index) => {
    const matchDate = new Date(r.matchTime);
    const diff = (matchDate - now) / 60000; // різниця у хвилинах
    if (diff <= r.minutesBefore && diff > r.minutesBefore - 1) {
      const match = matches.find((m) => m.id === r.matchId);
      if (!match) return;
      bot.telegram.sendMessage(
        r.userId,
        `⚽ Матч "${match.teams}" починається через ${
          r.minutesBefore
        } хв!\n🏟️ ${match.stadium}\n🏆 ${match.tournament}\n⌚ ${new Date(
          match.time
        ).toLocaleTimeString("uk-UA", {
          hour: "2-digit",
          minute: "2-digit",
        })}\n▶️ Дивитися трансляцію: ${match.streamUrl}`
      );
      reminders.splice(index, 1);
      saveReminders();
    }
  });
});

// ---- Глобальна обробка помилок ----
bot.catch((err, ctx) => {
  console.error("Bot error:", err);
  ctx.reply("Сталася помилка. Спробуйте ще раз.");
});

// ---- Запуск ----
bot.launch().then(() => console.log("Bot started"));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
