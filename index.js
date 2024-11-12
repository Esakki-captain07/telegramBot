import express from 'express';
import cors from 'cors';
import 'dotenv/config.js';
import routes from './src/router/index.js';
import { Telegraf } from 'telegraf';
import botService from './src/service/botService.js';

const PORT = process.env.PORT || 3000;
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Remove any existing webhook
bot.telegram.deleteWebhook()
    .then(() => {
        // Set the new webhook
        return bot.telegram.setWebhook(`https://telegrambot-yqfi.onrender.com/bot${process.env.TELEGRAM_BOT_TOKEN}`);
    })
    .then(() => console.log('Webhook set successfully'))
    .catch(err => console.error('Error setting webhook:', err));

const app = express();
app.use(express.json());
app.use(cors());
app.use(routes);

app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
    console.log('Incoming webhook:', JSON.stringify(req.body, null, 2));
    bot.handleUpdate(req.body)
        .then(() => console.log('Update handled successfully'))
        .catch(err => console.error('Error handling update:', err));
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Server is listening on PORT ${PORT}`);
});

// Ensure polling is disabled by not calling bot.launch()
