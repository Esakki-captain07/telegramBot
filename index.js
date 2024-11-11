import express from 'express';
import cors from 'cors';
import 'dotenv/config.js';
import routes from './src/router/index.js';
import { Telegraf } from 'telegraf';
import botService from './src/service/botService.js';  

const PORT = process.env.PORT || 3000;
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.telegram.setWebhook(`https://telegrambot-yqfi.onrender.com/bot${process.env.TELEGRAM_BOT_TOKEN}`);

const app = express();
app.use(express.json());
app.use(cors());
app.use(routes);

app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
    bot.handleUpdate(req.body);
    res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Server is listening on PORT ${PORT}`));
