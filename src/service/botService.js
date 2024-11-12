import botModel from "../model/botModel.js";
import { Telegraf } from "telegraf";
import dotenv from 'dotenv';
dotenv.config();
import authenticateUser from "../common/auth.js";

let fileIdForMovie = null;

// Route handler for posting movies
const postMovies = async (req, res) => {
    try {
        const { title, rating, fileId, versions, description, category, movieUrl } = req.body;

        const movie = new botModel({
            title,
            rating,
            fileId,
            versions,
            description,
            category,
            movieUrl
        });

        await movie.save();

        res.status(201).send({ message: `Success! The movie "${title}" has been uploaded and saved successfully.` });
    } catch (error) {
        console.error("Error uploading movie:", error);
        res.status(500).send({ message: 'Internal server error' });
    }
};



// Initialize Telegraf Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Command to prompt user for movie upload
bot.command("upload_movie", authenticateUser, async (ctx) => {
    await ctx.reply("Please upload the movie file as a document and provide title, rating, and description in the caption.");
});

// Handle movie document upload
bot.on("document", async (ctx) => {
    const file = ctx.message.document;
    const caption = ctx.message.caption || "";

    if (!caption) {
        await ctx.reply('Please provide movie details in the caption in the format: "Title; Rating; Description; Language; Quality".');
        return;
    }

    const movieDetails = caption.split(';').map(text => text.trim());
    const [title, rating, description, language, quality] = movieDetails;

    if (!title || !rating || !description || !language || !quality) {
        return ctx.reply("Missing details! Please use the format: Title; Rating; Description; Language; Quality.");
    }

    try {
        let movie = await botModel.findOne({ title });

        if (movie) {
            movie.versions.push({
                quality,
                language,
                fileId: file.file_id,
            });
        } else {
            movie = new botModel({
                title,
                rating,
                description,
                versions: [
                    {
                        quality,
                        language,
                        fileId: file.file_id,
                    },
                ],
            });
        }

        await movie.save();
        ctx.reply(`Successfully uploaded "${title}" in ${quality} quality.`);
    } catch (error) {
        console.error("Error saving movie:", error);
        ctx.reply("Failed to save the movie. Please try again.");
    }
});

// Handle text queries in chat
bot.on('text', async (ctx) => {
    const userMessage = ctx.message.text.toLowerCase();
    const chatType = ctx.chat.type;

    console.log("Chat Type:", chatType);
    console.log("User Message:", userMessage);

    if (chatType === 'private') {
        await ctx.reply(`Please request movies in the group: ${process.env.MAIN_CHANNEL_LINK}

You can also follow us on Instagram:
https://www.instagram.com/captain_love_edits`);
        return; 
    }

    if (chatType === 'supergroup' || chatType === 'group') {
        try {
            const movie = await botModel.findOne({ title: new RegExp(userMessage, 'i') });

            if (movie) {
                let optionsMessage = `Found: ${movie.title}\nDescription: ${movie.description}\nRating: ${movie.rating}\nChoose quality and language:`;

                const buttons = movie.versions.map((version) => ([{
                    text: `${version.quality} - ${version.language}`,
                    callback_data: `${movie._id}:${version.quality}:${version.language}`,
                }]));

                await ctx.reply(optionsMessage, {
                    reply_markup: {
                        inline_keyboard: buttons,
                    },
                });
            } else {
                await ctx.reply(`Movie not found in the database.

Request unavailable movies in the admin section, or follow us on Instagram:
https://www.instagram.com/captain_love_edits`);
            }
        } catch (error) {
            console.error("Error retrieving movie:", error);
            await ctx.reply("Error retrieving the movie. Please try again later.");
        }
    }
});

// Handle callback queries for specific movie version
bot.on('callback_query', async (ctx) => {
    const [movieId, quality, language] = ctx.callbackQuery.data.split(':');
    console.log(`Received movieId: ${movieId}, quality: ${quality}, language: ${language}`);

    try {
        const movie = await botModel.findById(movieId);
        if (!movie) {
            return await ctx.reply("Movie not found.");
        }

        const selectedVersion = movie.versions.find(
            (v) => v.quality === quality && v.language === language
        );

        if (selectedVersion?.fileId) {
            await ctx.telegram.sendDocument(ctx.from.id, selectedVersion.fileId, {
                caption: `Here is the requested movie: ${movie.title} (${quality} - ${language})`,
            });

            const botChannelLink = `https://t.me/${process.env.BOT_USERNAME}`;
            const keyboard = {
                inline_keyboard: [
                    [{ text: "Go to Bot's Channel", url: botChannelLink }]
                ]
            };

            await ctx.reply(
                `The movie "${movie.title}" (${quality} - ${language}) has been shared with you. Visit the bot's channel for more content.`,
                { reply_markup: keyboard }
            );
        } else {
            await ctx.reply("Sorry, the requested version is not available.");
        }
    } catch (error) {
        console.error("Error handling callback query:", error);
        await ctx.reply("Error retrieving the movie file. Please try again later.");
    }
});


export default {
    postMovies
};