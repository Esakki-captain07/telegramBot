import botModel from "../model/botModel.js";
import { Telegraf } from "telegraf";
import 'dotenv/config.js';
import authenticateUser from "../common/auth.js";

let fileIdForMovie = null; 

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

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);



bot.command("upload_movie", authenticateUser, async (ctx) => {
    await ctx.reply("Please upload the movie file as a document and provide title, rating, and description in the caption.");
});

bot.on("document", async (ctx) => {
    const file = ctx.message.document;
    const caption = ctx.message.caption || "";

    if (!caption) {
        await ctx.reply('Please provide the movie details in the caption with quality information. Example: "Movie Title; Rating; Description; Language; Quality (e.g., 720p or 1080p)"');
        return;
    }

    const movieDetails = caption.split(';').map(text => text.trim());
    const [title, rating, description, language, quality] = movieDetails;

    if (!title || !rating || !description || !language || !quality) {
        return ctx.reply("Please provide all required details in the format: Title; Rating; Description; Language; Quality.");
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

bot.on('text', async (ctx) => {
    const userMessage = ctx.message.text.toLowerCase();
    const chatType = ctx.chat.type;  

    console.log("Full Chat Object:", ctx.chat);
    console.log("Chat Type:", chatType);
    console.log("User Message:", userMessage);

    if (chatType === 'private') {
        console.log("Message is from a private chat");

        await ctx.reply(`Please ask for movies in the movie request group: ${process.env.MAIN_CHANNEL_LINK}
            
You can also follow us on Instagram:
https://www.instagram.com/captain_love_edits`);
        return; 
    }

    if (chatType === 'supergroup' || chatType === 'group') {
        console.log("Message is from a supergroup/group");

        try {
            const movie = await botModel.findOne({ title: new RegExp(userMessage, 'i') });

            if (movie) {
                let optionsMessage = `Found: ${movie.title}\nDescription: ${movie.description}\nRating: ${movie.rating}\nChoose the quality and language:`;

                const buttons = movie.versions.map((version) => ([{
                    text: `${version.quality} - ${version.language}`,
                    callback_data: `${movie._id}:${version.quality}:${version.language}`,
                }]));

                console.log("Movie found, sending options...");
                await ctx.reply(optionsMessage, {
                    reply_markup: {
                        inline_keyboard: buttons,
                    },
                });

            } else {
                console.log("Movie not found.");
                await ctx.reply(`Sorry, I couldn't find that movie in the database.
                                
This movie is not available.
Please ask for movies in the admin section,
and you will receive the movie within 2 hours
https://www.instagram.com/captain_love_edits`);
            }

        } catch (error) {
            console.error("Error retrieving movie:", error);
            await ctx.reply("There was an error retrieving the movie. Please try again later.");
        }
    }
});






bot.on('callback_query', async (ctx) => {
    const [movieId, quality, language] = ctx.callbackQuery.data.split(':');
    console.log(`Received movieId: ${movieId}, quality: ${quality}, language: ${language}`); 

    try {
        const movie = await botModel.findById(movieId);
        if (!movie) {
            console.log("Movie not found for ID:", movieId);  
            return await ctx.reply("Movie not found.");
        }

        const selectedVersion = movie.versions.find(
            (v) => v.quality === quality && v.language === language
        );

        if (selectedVersion && selectedVersion.fileId) {
            console.log(`Sending fileId: ${selectedVersion.fileId} to user: ${ctx.from.id}`);
            await ctx.telegram.sendDocument(ctx.from.id, selectedVersion.fileId, {
                caption: `Here is the requested movie: ${movie.title} (${quality} - ${language})`,
            });

            const buttonText = "Go to Bot's Channel"; 
            const botChannelLink = `https://t.me/${process.env.BOT_USERNAME}`; 
            const keyboard = {
                inline_keyboard: [
                    [
                        { text: buttonText, url: botChannelLink }
                    ]
                ]
            };

            await ctx.reply(
                `The movie "${movie.title}" (${quality} - ${language}) has been shared directly with you. ` +
                `Click the button below to visit the bot's channel and find more content.`,
                { reply_markup: keyboard }
            );
        } else {
            console.log("Selected version or fileId not found");
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
