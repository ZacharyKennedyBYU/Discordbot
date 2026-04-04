const { Client, GatewayIntentBits, Partials, Events } = require('discord.js');
const { OpenAI } = require('openai');
const path = require('path');
const fs = require('fs');
const { getDb } = require('./db');

class BotManager {
    constructor() {
        // Map of botId -> { client, openai, config }
        this.activeBots = new Map();
        // Map of discordMessageId -> { queue: [...], processing: bool }
        // Used to sequence multi-bot responses to the same message
        this.messageQueues = new Map();
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

        if (!botRow.discord_token) {
            return { success: false, error: 'No Discord token configured for this bot.' };
        }

        let openai = null;
        let visionOpenai = null;

        if (botRow.bot_type !== 'false') {
            // Fetch provider info
            let provider = null;
            if (botRow.provider_id) {
                provider = db.prepare('SELECT * FROM providers WHERE id = ?').get(botRow.provider_id);
            }

            if (!provider) {
                return { success: false, error: 'No API provider assigned to this bot. Please assign a provider first.' };
            }

            // Create OpenAI client pointing to the provider's base URL
            openai = new OpenAI({
                baseURL: provider.base_url,
                apiKey: provider.api_key,
                defaultHeaders: {
                    "HTTP-Referer": "https://github.com/cordbridge",
                    "X-Title": "CordBridge",
                }
            });

            // Create Vision OpenAI client if a separate provider is specified
            visionOpenai = openai; // Default to same as chat provider
            if (botRow.vision_provider_id && botRow.vision_provider_id !== botRow.provider_id) {
                const visionProvider = db.prepare('SELECT * FROM providers WHERE id = ?').get(botRow.vision_provider_id);
                if (visionProvider) {
                    visionOpenai = new OpenAI({
                        baseURL: visionProvider.base_url,
                        apiKey: visionProvider.api_key,
                        defaultHeaders: {
                            "HTTP-Referer": "https://github.com/cordbridge",
                            "X-Title": "CordBridge",
                        }
                    });
                }
            }
        }

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
                this.activeBots.set(botId, { client, openai, visionOpenai, config: botRow, discordTag: c.user.tag });
                resolve({ success: true, tag: c.user.tag });
            });

            client.on(Events.MessageCreate, async message => {
                await this._enqueueMessage(botId, message);
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
     * Enqueue a message for processing. If the Discord message mentions
     * multiple active bots, their responses are sequenced with a delay
     * so each bot can see the previous bot's reply. Different messages
     * get independent queues.
     */
    async _enqueueMessage(botId, message) {
        const entry = this.activeBots.get(botId);
        if (!entry) return;

        // Ignore bot messages
        if (message.author.bot) return;

        const isDM = message.channel.isDMBased();

        // ── ALLOWLIST LOGIC ──
        if (!isDM) {
            let allowedGuilds = [];
            try {
                if (entry.config.allowed_guilds) {
                    allowedGuilds = JSON.parse(entry.config.allowed_guilds);
                }
            } catch (_) {}
            
            if (allowedGuilds.length > 0 && !allowedGuilds.includes(message.guild?.id)) {
                return; // Dropped message because server is not in the allowlist
            }
        }

        // Check if this bot should respond
        const isMentioned = message.mentions.has(entry.client.user);
        if (!isMentioned && !isDM) return;

        // Count how many of our active bots are mentioned in this message
        let mentionedBotCount = 0;
        if (!isDM) {
            for (const [, botEntry] of this.activeBots) {
                if (message.mentions.has(botEntry.client.user)) {
                    mentionedBotCount++;
                }
            }
        }

        // Single bot mentioned (or DM) — process immediately, no queue
        if (mentionedBotCount <= 1) {
            await this._handleMessage(botId, message);
            return;
        }

        // Multi-bot mention — add to the per-message queue
        const msgId = message.id;
        if (!this.messageQueues.has(msgId)) {
            this.messageQueues.set(msgId, { queue: [], processing: false });
        }

        const queueEntry = this.messageQueues.get(msgId);
        queueEntry.queue.push({ botId, message });

        // Start processing if not already running for this message
        if (!queueEntry.processing) {
            queueEntry.processing = true;
            this._processQueue(msgId);
        }
    }

    /**
     * Process a message queue sequentially. Each bot responds one at a time
     * with a delay so responses appear naturally in Discord.
     */
    async _processQueue(msgId) {
        const queueEntry = this.messageQueues.get(msgId);
        if (!queueEntry) return;

        while (queueEntry.queue.length > 0) {
            const { botId, message } = queueEntry.queue.shift();

            try {
                await this._handleMessage(botId, message);
            } catch (err) {
                console.error(`[CordBridge] Queue error for bot ${botId}:`, err.message);
            }

            // Delay before the next bot responds (if there are more in queue)
            if (queueEntry.queue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }

        // Clean up
        this.messageQueues.delete(msgId);
    }

    /**
     * Handle an incoming Discord message for a specific bot.
     */
    async _handleMessage(botId, message) {
        const entry = this.activeBots.get(botId);
        if (!entry) return;

        const { client, openai, visionOpenai, config } = entry;

        // Ignore bot messages
        if (message.author.bot) return;

        // Check if mentioned or DM
        const isMentioned = message.mentions.has(client.user);
        const isDM = message.channel.isDMBased();
        if (!isMentioned && !isDM) return;

        // Extract user text
        // Extract user text
        let userText = message.content.replace(`<@${client.user.id}>`, '').trim();
        if (!userText && message.attachments.size === 0) userText = "Hello!";

        // Fetch replied message if it exists
        let repliedMessage = null;
        if (message.reference && message.reference.messageId) {
            try {
                repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
            } catch (err) {
                console.error(`[CordBridge] Failed to fetch replied message:`, err.message);
            }
        }

        // Gather image attachments (up to 3)
        const imagesToProcess = [];
        
        message.attachments.forEach(att => {
            if (att.contentType && att.contentType.startsWith('image/')) imagesToProcess.push(att.url);
        });
        
        if (repliedMessage) {
            repliedMessage.attachments.forEach(att => {
                if (att.contentType && att.contentType.startsWith('image/')) imagesToProcess.push(att.url);
            });
        }
        const images = imagesToProcess.slice(0, 3);

        // Generate Image Descriptions
        let imageDescriptions = [];
        if (images.length > 0 && config.use_chat_vision) {
            // Native Chat Vision is enabled, skip the secondary vision model here
        } else if (images.length > 0 && config.vision_model) {
            await message.channel.sendTyping(); // Show thinking state during vision processing
            for (let i = 0; i < images.length; i++) {
                try {
                    const visionResponse = await visionOpenai.chat.completions.create({
                        model: config.vision_model,
                        messages: [
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: "Please provide a detailed, concise description of this image. Focus on the main subjects, actions, environment, and mood so that someone who cannot see it can understand it perfectly." },
                                    { type: "image_url", image_url: { url: images[i] } }
                                ]
                            }
                        ],
                        max_tokens: 400
                    });
                    const desc = visionResponse.choices[0]?.message?.content?.trim();
                    if (desc) imageDescriptions.push(`[Attached Image ${i + 1} Description: ${desc}]`);
                } catch (err) {
                    console.error('[CordBridge] Vision API Error:', err.message);
                    imageDescriptions.push(`[Attached Image ${i + 1}: (Failed to read image due to API error)]`);
                }
            }
        } else if (images.length > 0 && !config.vision_model) {
            imageDescriptions.push(`[User attached ${images.length} image(s) but my optical sensors are disabled. I cannot see them.]`);
        }

        // Resolve Discord <@id> mentions back into actual usernames
        let resolvedText = userText;
        if (message.mentions.users.size > 0) {
            message.mentions.users.forEach(user => {
                resolvedText = resolvedText.replace(new RegExp(`<@!?${user.id}>`, 'g'), user.username);
            });
        }

        // Prepend contextual information
        let contextPrefix = "";
        if (repliedMessage) {
            let repText = repliedMessage.content;
            if (repliedMessage.mentions.users.size > 0) {
                repliedMessage.mentions.users.forEach(u => {
                    repText = repText.replace(new RegExp(`<@!?${u.id}>`, 'g'), u.username);
                });
            }
            contextPrefix += `[Replying to ${repliedMessage.author.username}'s message: "${repText}"]\n\n`;
        }
        
        if (imageDescriptions.length > 0) {
            contextPrefix += imageDescriptions.join('\n') + '\n\n';
        }
        
        if (contextPrefix) {
            resolvedText = contextPrefix + resolvedText;
        }

        const channelId = message.channel.id;
        const guildId = message.guild?.id || 'DM';
        const userContent = `${message.author.username}: ${resolvedText}`.trim();

        // Save the user's message to the database (with resolved names & image context)
        this._saveMessage(botId, channelId, guildId, 'user', userContent);

        // FALSE BOT LOGIC
        if (config.bot_type === 'false') {
            let phrases = [];
            try { phrases = JSON.parse(config.false_phrases || '[]'); } catch (e) {}
            if (phrases.length > 0) {
                try {
                    await message.channel.sendTyping();
                    await new Promise(resolve => setTimeout(resolve, 800)); // slight typing delay for realism
                    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
                    
                    if (typeof randomPhrase === 'object' && randomPhrase.type === 'audio') {
                        const filePath = path.join(__dirname, randomPhrase.path);
                        if (fs.existsSync(filePath)) {
                            await message.reply({ 
                                files: [{ 
                                    attachment: filePath, 
                                    name: 'response.mp3' 
                                }] 
                            });
                            this._saveMessage(botId, channelId, guildId, 'assistant', `[Sent audio file: ${randomPhrase.originalName || 'response.mp3'}]`);
                        } else {
                            await message.reply("[Error: Audio file not found]");
                            this._saveMessage(botId, channelId, guildId, 'assistant', '[Error: Audio file not found]');
                        }
                    } else {
                        // It's a string, or fallback
                        const text = typeof randomPhrase === 'string' ? randomPhrase : (randomPhrase.text || '...');
                        await message.reply(text);
                        this._saveMessage(botId, channelId, guildId, 'assistant', text);
                    }
                } catch (err) {
                    console.error(`[CordBridge] False Bot API Error:`, err.message);
                }
            }
            return;
        }

        try {
            await message.channel.sendTyping();

            // Build context from DB with compression (pass resolvedText for cross-bot awareness)
            const messages = await this._buildContext(botId, channelId, config, openai, resolvedText, message);

            // NATIVE CHAT VISION INJECTION
            if (config.use_chat_vision && images.length > 0) {
                // Find the last user message to attach the images natively (searching backwards in case of appended system contexts)
                for (let i = messages.length - 1; i >= 0; i--) {
                    if (messages[i].role === 'user') {
                        const userMsg = messages[i];
                        const textContent = userMsg.content;
                        const multimodalContent = [{ type: 'text', text: textContent }];
                        for (const imgUrl of images) {
                            multimodalContent.push({ type: 'image_url', image_url: { url: imgUrl } });
                        }
                        userMsg.content = multimodalContent;
                        break;
                    }
                }
            }

            // Prefill
            if (config.prefill && config.prefill.trim() !== '') {
                messages.push({ role: "assistant", content: config.prefill });
            }

            // Call the AI API
            const apiParams = {
                model: config.model,
                messages: messages,
                temperature: config.temperature,
                top_p: config.top_p,
                max_tokens: config.max_tokens,
                presence_penalty: config.presence_penalty,
                frequency_penalty: config.frequency_penalty,
            };

            // Inject Custom Provider Order via extra_body (OpenRouter format)
            let providersOrder = [];
            try {
                if (config.providers_order) providersOrder = JSON.parse(config.providers_order);
            } catch (_) {}
            
            if (providersOrder && providersOrder.length > 0) {
                apiParams.extra_body = {
                    provider: {
                        order: providersOrder,
                        allow_fallbacks: false
                    }
                };
            }

            const response = await openai.chat.completions.create(apiParams);

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

            // Save the bot's response to the database
            this._saveMessage(botId, channelId, guildId, 'assistant', replyContent);

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
     * Save a message to the database.
     */
    _saveMessage(botId, channelId, guildId, role, content) {
        try {
            const db = getDb();
            db.prepare('INSERT INTO messages (bot_id, channel_id, guild_id, role, content) VALUES (?, ?, ?, ?, ?)')
                .run(botId, channelId, guildId, role, content);
        } catch (err) {
            console.error('[CordBridge] Failed to save message:', err.message);
        }
    }

    /**
     * Build the message context array from stored history.
     * Fits as many recent messages as the token budget allows,
     * and summarizes older overflow messages via an AI call.
     */
    async _buildContext(botId, channelId, config, openai, userText = '', discordMessage = null) {
        const db = getDb();
        const messages = [];

        // 1a. Ambient channel context: fetch recent Discord messages for awareness
        //     These are NOT saved — they're ephemeral background context
        const allStoredMessages = db.prepare(
            'SELECT role, content FROM messages WHERE bot_id = ? AND channel_id = ? ORDER BY created_at ASC'
        ).all(botId, channelId);

        // 1b. Cross-bot awareness: if the user mentions another bot by name,
        //     inject that bot's character prompt so this bot knows about them
        const crossBotInfo = this._getReferencedBotInfo(config, userText);
        if (crossBotInfo) {
            messages.push({ role: "system", content: crossBotInfo });
        }

        // 1c. System prompt (always placed AFTER the ambient stuff so it's the strongest instruction)
        const systemContent = `${config.system_prompt || ''}\n\n${config.character_prompt || ''}`.trim();
        if (systemContent) {
            messages.push({ role: "system", content: `[YOUR IDENTITY AND INSTRUCTIONS]\n${systemContent}` });
        }

        // 1c-ii. Lorebook context: inject matched lorebook entries after system prompt
        const lorebookContext = this._buildLorebookContext(botId, userText);
        if (lorebookContext) {
            messages.push({ role: "system", content: lorebookContext });
        }

        // 1c. Identity anchor: always inject first_message so the bot knows its voice
        if (config.first_message && config.first_message.trim()) {
            messages.push({ role: "assistant", content: config.first_message });
        }

        // 1d. Example messages: extra context for tone/style, not part of conversation
        if (config.example_messages && config.example_messages.trim()) {
            messages.push({ role: "system", content: `[Example messages showing how this character typically talks — use these for tone and style reference only, do not repeat them verbatim:]\n${config.example_messages}` });
        }

        // 2. We already fetched ALL stored messages above into allStoredMessages
        if (allStoredMessages.length === 0) {
            return messages;
        }

        if (allStoredMessages.length === 0) {
            return messages;
        }

        // 3. Token budget calculation
        const totalBudget = (config.max_prompt_tokens || 10000);
        let reservedTokens = 50; // Start with a 50 token safety margin

        // Account for all tokens already placed in the 'messages' array (system prompt, first message, cross-bot context, etc)
        for (const m of messages) {
            reservedTokens += this._estimateTokens(m.content);
        }
        
        // Add prefill token cost
        if (config.prefill && typeof config.prefill === 'string') {
            reservedTokens += this._estimateTokens(config.prefill);
        }
        
        // Reserve an estimated 350 tokens for the AI summary string that will be injected if there is an overflow
        reservedTokens += 350;

        let availableBudget = totalBudget - reservedTokens;

        if (availableBudget < 200) availableBudget = 200; // minimum

        // 4. Walk messages newest→oldest, accumulate until budget is spent
        const recentMessages = [];
        let recentTokens = 0;
        let cutoffIndex = allStoredMessages.length; // everything is "recent" by default

        for (let i = allStoredMessages.length - 1; i >= 0; i--) {
            const msg = allStoredMessages[i];
            const msgTokens = this._estimateTokens(msg.content);
            if (recentTokens + msgTokens > availableBudget) {
                cutoffIndex = i + 1; // messages 0..i are "old"
                break;
            }
            recentTokens += msgTokens;
            recentMessages.unshift({ role: msg.role, content: msg.content });
            cutoffIndex = i;
        }

        // 5. If there are older messages that didn't fit, summarize them
        if (cutoffIndex > 0) {
            const oldMessages = allStoredMessages.slice(0, cutoffIndex);
            // Reserve ~25% of the budget for the summary
            const summaryMaxTokens = Math.min(300, Math.floor(availableBudget * 0.25));

            try {
                const summary = await this._summarizeMessages(oldMessages, openai, config.model, summaryMaxTokens);
                if (summary) {
                    messages.push({
                        role: "system",
                        content: `[Previous conversation summary]\n${summary}`
                    });
                }
            } catch (err) {
                console.error('[CordBridge] Summary generation failed, skipping older context:', err.message);
            }
        }

        // 6. Append the recent messages (verbatim)
        messages.push(...recentMessages);

        // 7. Ambient channel context: fetch recent Discord messages for situational awareness
        // Placed at the very end so it chronologically represents immediate surrounding events
        const channelContext = await this._fetchChannelContext(botId, discordMessage, allStoredMessages);
        if (channelContext) {
            messages.push({ role: "system", content: channelContext });
        }

        return messages;
    }

    /**
     * Ask the AI to summarize a list of older messages into a compact paragraph.
     */
    async _summarizeMessages(oldMessages, openai, model, maxTokens) {
        const transcript = oldMessages.map(m =>
            `${m.role === 'user' ? 'User' : 'Bot'}: ${m.content}`
        ).join('\n');

        // Truncate the transcript itself if absurdly long (>40k chars ≈ 10k tokens)
        const truncatedTranscript = transcript.length > 40000
            ? transcript.substring(0, 40000) + '\n... [older messages truncated]'
            : transcript;

        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: "system",
                    content: "You are an AI conversation memory summarizer. Condense the following conversation into a dense summary paragraph. CRITICAL: Pay special attention to the relationship between the bot and each unique user (or other bot) it interacts with. Note their dynamics, established rapport, stated opinions about each other, inside jokes, and key facts. Preserve names and important topics, but prioritize how characters relate to one another."
                },
                {
                    role: "user",
                    content: truncatedTranscript
                }
            ],
            temperature: 0.3,
            max_tokens: maxTokens,
        });

        return response.choices[0].message.content.trim();
    }

    /**
     * Build lorebook context for a bot based on attached lorebooks and user text.
     * Returns a system message string with matched entries, or null.
     */
    _buildLorebookContext(botId, userText) {
        const db = getDb();
        const rows = db.prepare(`
            SELECT bl.overrides, l.data
            FROM bot_lorebooks bl
            JOIN lorebooks l ON bl.lorebook_id = l.id
            WHERE bl.bot_id = ?
        `).all(botId);

        if (rows.length === 0) return null;

        const matchedEntries = [];
        const lowerText = (userText || '').toLowerCase();

        for (const row of rows) {
            let lorebookData, overrides;
            try {
                lorebookData = JSON.parse(row.data);
                overrides = JSON.parse(row.overrides || '{}');
            } catch (e) {
                continue;
            }

            if (!lorebookData.entries) continue;

            for (const [uid, entry] of Object.entries(lorebookData.entries)) {
                if (!entry.content) continue;

                // Determine state: check override first, then fall back to entry defaults
                const state = overrides[uid] || overrides[entry.uid] || 'moon'; // default is moon

                if (state === 'off') continue;

                if (state === 'sun') {
                    // Always include
                    matchedEntries.push(entry.content);
                    continue;
                }

                // state === 'moon': check if any key or secondary key matches in user text
                const allKeys = [
                    ...(Array.isArray(entry.key) ? entry.key : (entry.keys || [])),
                    ...(Array.isArray(entry.keysecondary) ? entry.keysecondary : (entry.secondary_keys || []))
                ];

                const matched = allKeys.some(k => {
                    if (!k) return false;
                    return lowerText.includes(k.toLowerCase());
                });

                if (matched) {
                    matchedEntries.push(entry.content);
                }
            }
        }

        if (matchedEntries.length === 0) return null;

        return `[Lorebook Context — relevant world information]\n${matchedEntries.join('\n\n')}`;
    }

    /**
     * Check if the user's message mentions any other bots by name.
     * If so, return a system message with those bots' character prompts.
     * Handles case-insensitive matching and @ prefixes.
     */
    _getReferencedBotInfo(currentBotConfig, userText) {
        if (!userText) return null;

        const db = getDb();
        const allBots = db.prepare('SELECT id, name, character_prompt FROM bots WHERE id != ?').all(currentBotConfig.id);

        if (allBots.length === 0) return null;

        // Strip Discord mention tags like <@123456> and normalize
        const cleanedText = userText.replace(/<@!?\d+>/g, '').toLowerCase();

        const matchedBots = [];
        for (const bot of allBots) {
            if (!bot.name || !bot.character_prompt) continue;

            // Match the bot name case-insensitively, also check with @ prefix stripped
            const botNameLower = bot.name.toLowerCase();
            // Check for: "botname", "@botname", or the name appearing as a word in the text
            const namePattern = new RegExp(`(?:^|[\\s@])${botNameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[\\s,!?.;:]|$)`, 'i');
            if (namePattern.test(cleanedText) || cleanedText.includes(botNameLower)) {
                matchedBots.push(bot);
            }
        }

        if (matchedBots.length === 0) return null;

        const infoParts = matchedBots.map(bot =>
            `<character_info>\nName: ${bot.name}\nPersona: ${bot.character_prompt}\n</character_info>`
        );

        return `[CRITICAL CONTEXT: The user mentioned other character(s) in this conversation. Below is their character information for your awareness only. You must NOT roleplay as them. You must strictly remain "${currentBotConfig.name}".]\n\n${infoParts.join('\n\n')}`;
    }

    /**
     * Fetch recent channel messages from Discord for ambient awareness.
     * Filters out messages already in saved conversation history.
     * Returns a formatted system message or null if nothing useful.
     */
    async _fetchChannelContext(botId, discordMessage, savedMessages) {
        if (!discordMessage || discordMessage.channel.isDMBased()) return null;

        const entry = this.activeBots.get(botId);
        const botDiscordId = entry ? entry.client.user.id : null;

        try {
            const fetched = await discordMessage.channel.messages.fetch({ limit: 15 });
            const channelMsgs = [...fetched.values()].reverse(); // oldest first

            // Build a set of saved message contents for deduplication
            const savedContentSet = new Set(savedMessages.map(m => m.content));

            const contextLines = [];
            for (const msg of channelMsgs) {
                // Skip the triggering message itself (it's already saved)
                if (msg.id === discordMessage.id) continue;
                
                // Skip messages sent by THIS specific bot to prevent reading its own output
                // as though it were third-party background activity
                if (botDiscordId && msg.author.id === botDiscordId) continue;

                let text = msg.content.trim();
                if (!text) continue;

                // Resolve <@id> mentions to usernames
                if (msg.mentions.users.size > 0) {
                    msg.mentions.users.forEach(user => {
                        text = text.replace(new RegExp(`<@!?${user.id}>`, 'g'), `@${user.username}`);
                    });
                }

                const formatted = `${msg.author.username}: ${text}`;

                // Skip if this message is already in saved conversation history
                if (savedContentSet.has(formatted)) continue;

                contextLines.push(formatted);
            }

            if (contextLines.length === 0) return null;

            return `[Recent channel activity — these are background messages you were not directly part of, for situational awareness only:]\n${contextLines.join('\n')}`;
        } catch (err) {
            console.error('[CordBridge] Could not fetch channel context:', err.message);
            return null;
        }
    }

    /**
     * Rough token estimate: ~4 chars per token (same heuristic used elsewhere).
     */
    _estimateTokens(text) {
        if (!text) return 0;
        return Math.ceil(text.length / 4);
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
