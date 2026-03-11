const { Client, GatewayIntentBits, Partials, Events } = require('discord.js');
const { OpenAI } = require('openai');
const { getDb } = require('./db');

class BotManager {
    constructor() {
        // Map of botId -> { client, openai, config }
        this.activeBots = new Map();
    }

    /**
     * Returns the status of all bots (id, name, online/offline).
     */
    getStatuses() {
        const db = getDb();
        const bots = db.prepare('SELECT id, name FROM bots').all();
        return bots.map(bot => ({
            id: bot.id,
            name: bot.name,
            online: this.activeBots.has(bot.id),
        }));
    }

    /**
     * Returns whether a specific bot is online.
     */
    isOnline(botId) {
        return this.activeBots.has(botId);
    }

    /**
     * Starts a bot by its database ID.
     */
    async startBot(botId) {
        if (this.activeBots.has(botId)) {
            return { success: false, error: 'Bot is already running.' };
        }

        const db = getDb();
        const botRow = db.prepare('SELECT * FROM bots WHERE id = ?').get(botId);
        if (!botRow) {
            return { success: false, error: 'Bot not found in database.' };
        }

        // Fetch provider info
        let provider = null;
        if (botRow.provider_id) {
            provider = db.prepare('SELECT * FROM providers WHERE id = ?').get(botRow.provider_id);
        }

        if (!provider) {
            return { success: false, error: 'No API provider assigned to this bot. Please assign a provider first.' };
        }

        if (!botRow.discord_token) {
            return { success: false, error: 'No Discord token configured for this bot.' };
        }

        // Create OpenAI client pointing to the provider's base URL
        const openai = new OpenAI({
            baseURL: provider.base_url,
            apiKey: provider.api_key,
            defaultHeaders: {
                "HTTP-Referer": "https://github.com/cordbridge",
                "X-Title": "CordBridge",
            }
        });

        // Create Discord client
        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages,
            ],
            partials: [Partials.Channel, Partials.Message]
        });

        return new Promise((resolve) => {
            client.once(Events.ClientReady, c => {
                console.log(`[CordBridge] Bot "${botRow.name}" online as ${c.user.tag}`);
                this.activeBots.set(botId, { client, openai, config: botRow, discordTag: c.user.tag });
                resolve({ success: true, tag: c.user.tag });
            });

            client.on(Events.MessageCreate, async message => {
                await this._handleMessage(botId, message);
            });

            client.login(botRow.discord_token).catch(err => {
                console.error(`[CordBridge] Failed to start bot "${botRow.name}":`, err.message);
                resolve({ success: false, error: `Discord login failed: ${err.message}` });
            });
        });
    }

    /**
     * Stops a bot by its database ID.
     */
    async stopBot(botId) {
        const entry = this.activeBots.get(botId);
        if (!entry) {
            return { success: false, error: 'Bot is not running.' };
        }

        try {
            entry.client.destroy();
            this.activeBots.delete(botId);
            console.log(`[CordBridge] Bot id=${botId} stopped.`);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    /**
     * Reloads config for a running bot (e.g. after settings change).
     */
    reloadConfig(botId) {
        const entry = this.activeBots.get(botId);
        if (!entry) return;

        const db = getDb();
        const botRow = db.prepare('SELECT * FROM bots WHERE id = ?').get(botId);
        if (botRow) {
            entry.config = botRow;
        }

        // Also reload the OpenAI client if provider changed
        if (botRow && botRow.provider_id) {
            const provider = db.prepare('SELECT * FROM providers WHERE id = ?').get(botRow.provider_id);
            if (provider) {
                entry.openai = new OpenAI({
                    baseURL: provider.base_url,
                    apiKey: provider.api_key,
                    defaultHeaders: {
                        "HTTP-Referer": "https://github.com/cordbridge",
                        "X-Title": "CordBridge",
                    }
                });
            }
        }
    }

    /**
     * Handle an incoming Discord message for a specific bot.
     */
    async _handleMessage(botId, message) {
        const entry = this.activeBots.get(botId);
        if (!entry) return;

        const { client, openai, config } = entry;

        // Ignore bot messages
        if (message.author.bot) return;

        // Check if mentioned or DM
        const isMentioned = message.mentions.has(client.user);
        const isDM = message.channel.isDMBased();
        if (!isMentioned && !isDM) return;

        // Extract user text
        let userText = message.content.replace(`<@${client.user.id}>`, '').trim();

        // Truncate if over prompt token limit
        if (config.max_prompt_tokens) {
            const charLimit = config.max_prompt_tokens * 4;
            if (userText.length > charLimit) {
                userText = userText.substring(0, charLimit) + "... [truncated]";
            }
        }

        if (!userText) userText = "Hello!";

        try {
            await message.channel.sendTyping();

            const messages = [];

            // System + character prompt
            const systemContent = `${config.system_prompt || ''}\n\n${config.character_prompt || ''}`.trim();
            if (systemContent) {
                messages.push({ role: "system", content: systemContent });
            }

            // Fetch recent messages for context
            try {
                const previousMessages = await message.channel.messages.fetch({ limit: 6 });
                previousMessages.reverse().forEach(msg => {
                    if (msg.id === message.id) return;
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
                console.error("[CordBridge] Could not fetch chat history:", err.message);
            }

            messages.push({ role: "user", content: `${message.author.username}: ${userText}` });

            // Prefill
            if (config.prefill && config.prefill.trim() !== '') {
                messages.push({ role: "assistant", content: config.prefill });
            }

            // Call the AI API
            const response = await openai.chat.completions.create({
                model: config.model,
                messages: messages,
                temperature: config.temperature,
                top_p: config.top_p,
                max_tokens: config.max_tokens,
                presence_penalty: config.presence_penalty,
                frequency_penalty: config.frequency_penalty,
            });

            let replyContent = response.choices[0].message.content;

            // Clean AI prefixes
            replyContent = replyContent.replace(/^(?:\*\*?)?[A-Za-z0-9\s-]{1,30}(?:\*\*?)?\s*:/i, '').trim();
            replyContent = replyContent.replace(/<instruction>[\s\S]*?<\/instruction>/gi, '');
            replyContent = replyContent.replace(/<\/?assistant>/gi, '');
            replyContent = replyContent.replace(/<\/?instruction>/gi, '');
            replyContent = replyContent.trim();

            // Prepend prefill
            if (config.prefill && config.prefill.trim() !== '') {
                replyContent = config.prefill + replyContent;
            }

            // Chunk if over Discord's 2000 char limit
            if (replyContent.length > 2000) {
                const chunks = replyContent.match(/[\s\S]{1,1999}/g) || [];
                for (const chunk of chunks) {
                    await message.reply(chunk);
                }
            } else {
                await message.reply(replyContent);
            }

        } catch (error) {
            console.error(`[CordBridge] API Error for bot "${config.name}":`, error.message);
            try {
                await message.reply('Sorry, I encountered an error while trying to process that request.');
            } catch (_) { /* ignore reply errors */ }
        }
    }

    /**
     * Auto-start all bots that have auto_start enabled.
     */
    async autoStartAll() {
        const db = getDb();
        const bots = db.prepare('SELECT id, name FROM bots WHERE auto_start = 1').all();
        console.log(`[CordBridge] Auto-starting ${bots.length} bot(s)...`);
        for (const bot of bots) {
            const result = await this.startBot(bot.id);
            if (result.success) {
                console.log(`[CordBridge] Auto-started "${bot.name}" successfully.`);
            } else {
                console.error(`[CordBridge] Failed to auto-start "${bot.name}": ${result.error}`);
            }
        }
    }

    /**
     * Stop all active bots (for graceful shutdown).
     */
    async stopAll() {
        for (const [botId] of this.activeBots) {
            await this.stopBot(botId);
        }
    }
}

module.exports = BotManager;
