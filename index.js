require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits, Partials, Events } = require('discord.js');
const { OpenAI } = require('openai');

// Load configuration
let config;
try {
    const configFile = fs.readFileSync('./config.json', 'utf8');
    config = JSON.parse(configFile);
} catch (error) {
    console.error('[Error] Could not read config.json. Please make sure the file exists and is valid JSON.', error.message);
    process.exit(1);
}

// Ensure environment variables are loaded
if (!process.env.DISCORD_TOKEN || !process.env.OPENROUTER_API_KEY) {
    console.error('[Error] DISCORD_TOKEN or OPENROUTER_API_KEY is missing in your .env file.');
    process.exit(1);
}

// Initialize OpenAI client pointing to OpenRouter
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": "https://github.com/cordbot", // Optional, helps OpenRouter identify your app
        "X-Title": "Cordbot", // Optional
    }
});

// Initialize Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message] // Needed for DMs
});

client.once(Events.ClientReady, c => {
    console.log(`[Success] Ready! Logged in as ${c.user.tag}`);
    console.log(`[Info] Using model: ${config.model}`);
});

client.on(Events.MessageCreate, async message => {
    // Ignore messages from bots (including ourselves)
    if (message.author.bot) return;

    // Check if the bot was mentioned or if it's a Direct Message
    const isMentioned = message.mentions.has(client.user);
    const isDM = message.channel.isDMBased();

    // If we're not mentioned in a server, and it's not a DM, ignore
    if (!isMentioned && !isDM) return;

    // Extract the user's message text, removing the bot mention if present
    let userText = message.content.replace(`<@${client.user.id}>`, '').trim();

    // Evaluate input tokens to enforce the max_prompt_tokens parameter 
    // Approx 1 token = 4 characters. Truncate if it goes over to avoid big bills.
    if (config.model_params && config.model_params.max_prompt_tokens) {
        const charLimit = config.model_params.max_prompt_tokens * 4;
        if (userText.length > charLimit) {
            userText = userText.substring(0, charLimit) + "... [truncated due to length]";
            console.log(`[Info] Truncated overly long message from user ${message.author.tag}`);
        }
    }

    // If the user just tags the bot with no text, provide a default greeting
    if (!userText) {
        userText = "Hello!";
    }

    try {
        // Show the visually appealing "Bot is typing..." indicator in Discord
        await message.channel.sendTyping();

        // Prepare the messages array for OpenRouter
        const messages = [];

        // Combine system and character prompts from config
        const systemContent = `${config.system_prompt}\n\n${config.character_prompt}`.trim();
        if (systemContent) {
            messages.push({ role: "system", content: systemContent });
        }

        // Fetch recent messages for memory context (e.g. last 6 messages)
        try {
            // fetch last 6 messages (includes the current one)
            const previousMessages = await message.channel.messages.fetch({ limit: 6 });
            // The discord API returns messages from newest to oldest, so we reverse it
            previousMessages.reverse().forEach(msg => {
                if (msg.id === message.id) return; // Skip current message, we add it later

                if (msg.author.id === client.user.id) {
                    messages.push({ role: "assistant", content: msg.content });
                } else {
                    let text = msg.content.replace(`<@${client.user.id}>`, '').trim();
                    if (text) {
                        messages.push({ role: "user", content: `${msg.author.username}: ${text}` });
                    }
                }
            });
        } catch (err) {
            console.error("[Warning] Could not fetch chat history.", err);
        }

        // Add the current user's message
        messages.push({ role: "user", content: `${message.author.username}: ${userText}` });

        // Add prefill as an assistant message if configured
        if (config.prefill && config.prefill.trim() !== '') {
            messages.push({ role: "assistant", content: config.prefill });
        }

        // Call the OpenRouter API
        const response = await openai.chat.completions.create({
            model: config.model,
            messages: messages,
            temperature: config.model_params.temperature,
            top_p: config.model_params.top_p,
            max_tokens: config.model_params.max_tokens,
            presence_penalty: config.model_params.presence_penalty,
            frequency_penalty: config.model_params.frequency_penalty,
        });

        let replyContent = response.choices[0].message.content;

        // Clean up common AI prefixes that mimic usernames, since Discord already shows who is talking
        // Replace something like "Grok:", "**Grok**:", "Coco:", or "Name:"" at the very beginning
        replyContent = replyContent.replace(/^(?:\*\*?)?[A-Za-z0-9\s-]{1,30}(?:\*\*?)?\s*:/i, '').trim();

        // Clean up jailbreak tags where the AI echoes instructions or wraps its output in <assistant>
        replyContent = replyContent.replace(/<instruction>[\s\S]*?<\/instruction>/gi, '');
        replyContent = replyContent.replace(/<\/?assistant>/gi, '');
        replyContent = replyContent.replace(/<\/?instruction>/gi, '');
        replyContent = replyContent.trim();

        // If there was a prefill, it's often helpful to prepend it to the final response
        // So the user sees the full text the model completed
        if (config.prefill && config.prefill.trim() !== '') {
            replyContent = config.prefill + replyContent;
        }

        // Discord message limit is 2000 characters. Split if necessary.
        if (replyContent.length > 2000) {
            // Chunk up to 1999 characters max, ensuring we don't break mid-word if possible
            // but simpler regex chunking works fine for standard chat.
            const chunks = replyContent.match(/[\s\S]{1,1999}/g) || [];
            for (const chunk of chunks) {
                await message.reply(chunk);
            }
        } else {
            // Standard reply
            await message.reply(replyContent);
        }

    } catch (error) {
        console.error('[API Error]', error);
        await message.reply('Sorry, I encountered an error while trying to process that request.');
    }
});

// Start the bot
client.login(process.env.DISCORD_TOKEN);
