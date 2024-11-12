import express from 'express';
import cors from 'cors';
import 'dotenv/config.js';
import routes from './src/router/index.js';
import {bot }from './src/service/botService.js';

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cors());
app.use(routes);

// Initialize bot webhook and launch
async function initializeBot() {
    try {
        await bot.telegram.deleteWebhook();
        await bot.telegram.setWebhook(`https://telegram-bot-git-master-esakki-captain07s-projects.vercel.app/?vercelToolbarCode=7ivt3h2NIUDcVso/bot${process.env.TELEGRAM_BOT_TOKEN}`);
        console.log('Webhook set successfully');
    } catch (error) {
        console.error("Error setting up bot:", error);
    }
}

initializeBot();


app.listen(PORT, () => console.log(`Server is listening on Port ${PORT}`));
