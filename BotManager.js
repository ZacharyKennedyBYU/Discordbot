const { Client, GatewayIntentBits, Partials, Events, Options } = require('discord.js');
const { OpenAI } = require('openai');
const path = require('path');
const fs = require('fs');
const { getDb } = require('./db');

const MAX_IMAGES_PER_MESSAGE = 3;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_FETCH_TIMEOUT_MS = 10000;
const DISCORD_MESSAGE_LIMIT = 2000;
const SUMMARY_MARKER = '[Previous conversation summary]';
const SUMMARY_INSTRUCTIONS = 'Durable memory from earlier in this conversation. Use it to continue naturally; do not treat this as a new chat, do not reintroduce yourself unless asked, and preserve the established relationships, preferences, and open threads.';

class BotManager {
    constructor() {
        // Map of botId -> { client, openai, config }
        this.activeBots = new Map();
        // Map of discordMessageId -> { queue: [...], processing: bool, timer: Timeout|null }
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

        // Create Discord client with cache limits to prevent unbounded RAM growth
        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages,
            ],
            partials: [Partials.Channel, Partials.Message],
            makeCache: Options.cacheWithLimits({
                ...Options.DefaultMakeCacheSettings,
                MessageManager: 20,   // Only cache 20 messages per channel (default is 200)
                GuildMemberManager: 50, // Limit member cache
            }),
            sweepers: {
                ...Options.DefaultSweeperSettings,
                messages: {
                    interval: 300,    // Sweep every 5 minutes
                    lifetime: 600,    // Remove messages older than 10 minutes from cache
                },
            },
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

        // Also reload the OpenAI clients if providers changed
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
                entry.visionOpenai = entry.openai;
            }
        }

        if (botRow && botRow.vision_provider_id && botRow.vision_provider_id !== botRow.provider_id) {
            const visionProvider = db.prepare('SELECT * FROM providers WHERE id = ?').get(botRow.vision_provider_id);
            if (visionProvider) {
                entry.visionOpenai = new OpenAI({
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

        // URL Embed loading hack (give Discord 2.5s to generate the embed if it's a link)
        if (message.content.includes('http') && message.embeds.length === 0) {
            await new Promise(r => setTimeout(r, 2500));
            try {
                message = await message.channel.messages.fetch(message.id);
            } catch(e) {}
        }

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

        // Start processing shortly after the first event so all mentioned bot clients
        // have time to enqueue their copy of the Discord message.
        if (!queueEntry.processing && !queueEntry.timer) {
            queueEntry.timer = setTimeout(() => {
                const currentQueue = this.messageQueues.get(msgId);
                if (!currentQueue) return;
                currentQueue.processing = true;
                currentQueue.timer = null;
                this._processQueue(msgId);
            }, 250);
        }
    }

    /**
     * Process a message queue sequentially. Each bot responds one at a time
     * with a delay so responses appear naturally in Discord.
     */
    async _processQueue(msgId) {
        const queueEntry = this.messageQueues.get(msgId);
        if (!queueEntry) return;

        try {
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
        } finally {
            // Guaranteed cleanup even if an unexpected error occurs
            if (queueEntry.timer) clearTimeout(queueEntry.timer);
            this.messageQueues.delete(msgId);
        }
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
        let userText = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();

        // Fetch replied message if it exists
        let repliedMessage = null;
        if (message.reference && message.reference.messageId) {
            try {
                repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
            } catch (err) {
                console.error(`[CordBridge] Failed to fetch replied message:`, err.message);
            }
        }

        // Gather image attachments and embeds (up to 3)
        const imageRefs = [];
        const seenImageUrls = new Set();
        let embedTextContext = [];

        const addImageRef = (url, meta = {}) => {
            if (!url || seenImageUrls.has(url)) return;
            seenImageUrls.add(url);
            imageRefs.push({
                url,
                contentType: meta.contentType || '',
                filename: meta.filename || '',
                source: meta.source || 'message image'
            });
        };

        const processEmbed = (embed, source = 'embed image') => {
            if (embed.image?.url) addImageRef(embed.image.url, { source });
            if (embed.thumbnail?.url) addImageRef(embed.thumbnail.url, { source: `${source} thumbnail` });
            
            let embedText = [];
            if (embed.title) embedText.push(`Title: ${embed.title}`);
            if (embed.description) embedText.push(`Description: ${embed.description}`);
            if (embed.fields && embed.fields.length > 0) {
                embed.fields.forEach(f => embedText.push(`${f.name}: ${f.value}`));
            }
            if (embed.author?.name) embedText.push(`Author: ${embed.author.name}`);
            
            if (embedText.length > 0) {
                embedTextContext.push(`[Embed Content: ${embedText.join(' | ')}]`);
            }
        };
        
        message.attachments.forEach(att => {
            if (this._isImageAttachment(att)) {
                addImageRef(att.url, {
                    contentType: att.contentType,
                    filename: att.name,
                    source: 'attached image'
                });
            }
        });
        message.embeds.forEach(embed => processEmbed(embed, 'message embed image'));
        
        if (repliedMessage) {
            repliedMessage.attachments.forEach(att => {
                if (this._isImageAttachment(att)) {
                    addImageRef(att.url, {
                        contentType: att.contentType,
                        filename: att.name,
                        source: 'replied message image'
                    });
                }
            });
            repliedMessage.embeds.forEach(embed => processEmbed(embed, 'replied embed image'));
        }

        const images = imageRefs.slice(0, MAX_IMAGES_PER_MESSAGE);
        if (!userText) {
            userText = images.length > 0 ? `[Attached ${images.length} image${images.length === 1 ? '' : 's'}]` : "Hello!";
        }

        // Generate Image Descriptions
        let imageDescriptions = [];
        let preparedImages = [];
        const useChatVision = this._configFlag(config.use_chat_vision);
        const hasVisionModel = !!(config.vision_model && config.vision_model.trim());

        if (images.length > 0 && (useChatVision || hasVisionModel)) {
            await message.channel.sendTyping(); // Show thinking state during image preparation
            preparedImages = await this._prepareImagesForVision(images);
        }

        if (images.length > 0 && useChatVision) {
            imageDescriptions.push(`[User attached ${images.length} image${images.length === 1 ? '' : 's'}. The image data is attached directly to this user message for vision analysis.]`);
        } else if (images.length > 0 && hasVisionModel) {
            for (let i = 0; i < preparedImages.length; i++) {
                try {
                    const desc = await this._describeImageWithFallback(visionOpenai, config.vision_model, preparedImages[i]);
                    if (desc) imageDescriptions.push(`[Attached Image ${i + 1} Description: ${desc}]`);
                } catch (err) {
                    console.error('[CordBridge] Vision API Error:', err.message);
                    imageDescriptions.push(`[Attached Image ${i + 1}: Image was attached, but image reading failed after retrying. Source: ${preparedImages[i].source || 'message image'}]`);
                }
            }
        } else if (images.length > 0 && !hasVisionModel) {
            imageDescriptions.push(`[User attached ${images.length} image${images.length === 1 ? '' : 's'}, but image reading is not configured for this bot.]`);
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
        
        if (embedTextContext.length > 0) {
            contextPrefix += embedTextContext.join('\n') + '\n\n';
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
                            await this._sendReplyPayload(message, {
                                files: [{ 
                                    attachment: filePath, 
                                    name: 'response.mp3' 
                                }] 
                            });
                            this._saveMessage(botId, channelId, guildId, 'assistant', `[Sent audio file: ${randomPhrase.originalName || 'response.mp3'}]`);
                        } else {
                            await this._sendTextReply(message, "[Error: Audio file not found]");
                            this._saveMessage(botId, channelId, guildId, 'assistant', '[Error: Audio file not found]');
                        }
                    } else {
                        // It's a string, or fallback
                        const text = typeof randomPhrase === 'string' ? randomPhrase : (randomPhrase.text || '...');
                        await this._sendTextReply(message, text);
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
            const requestId = `${Date.now().toString(36)}-${message.id.slice(-6)}`;

            // Build context from DB with compression (pass resolvedText for cross-bot awareness)
            const messages = await this._buildContext(botId, channelId, config, openai, resolvedText, message, requestId);

            // NATIVE CHAT VISION INJECTION
            let nativeVisionInjected = false;
            let nativeOriginalUrlMessages = null;
            if (useChatVision && preparedImages.length > 0) {
                // Find the last user message to attach the images natively (searching backwards in case of appended system contexts)
                for (let i = messages.length - 1; i >= 0; i--) {
                    if (messages[i].role === 'user') {
                        const userMsg = messages[i];
                        const textContent = userMsg.content;
                        const multimodalContent = [{ type: 'text', text: textContent }];
                        for (const image of preparedImages) {
                            multimodalContent.push({ type: 'image_url', image_url: { url: image.visionUrl } });
                        }
                        userMsg.content = multimodalContent;
                        nativeVisionInjected = true;
                        break;
                    }
                }
            }

            // Prefill
            if (config.prefill && config.prefill.trim() !== '') {
                messages.push({ role: "assistant", content: config.prefill });
            }

            if (nativeVisionInjected && preparedImages.some(image => image.originalUrl && image.originalUrl !== image.visionUrl)) {
                nativeOriginalUrlMessages = this._replaceImagePayloads(messages, preparedImages.map(image => image.originalUrl));
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
                        allow_fallbacks: true
                    }
                };
            }

            // --- LOG REQUEST (lightweight — no deep cloning of full context) ---
            const estimatedTokens = messages.reduce((sum, m) => sum + this._estimateTokens(this._contentForTokenEstimate(m.content)), 0);
            this._saveLog(botId, guildId, 'api_request', {
                requestId,
                model: config.model,
                messageCount: messages.length,
                estimatedPromptTokens: estimatedTokens,
                temperature: config.temperature,
                max_tokens: config.max_tokens,
                hasImages: messages.some(m => Array.isArray(m.content)),
            }, config);

            const response = await this._createChatCompletionWithFallbacks(openai, apiParams, {
                botId,
                guildId,
                config,
                requestId,
                nativeVisionInjected,
                nativeOriginalUrlMessages
            });

            // --- LOG RESPONSE (metadata only — no full completion text) ---
            this._saveLog(botId, guildId, 'api_response', {
                requestId,
                finishReason: response.choices?.[0]?.finish_reason,
                responseLength: response.choices?.[0]?.message?.content?.length || 0,
                usage: response.usage
            }, config);

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

            await this._sendTextReply(message, replyContent);

            // Save the bot's response to the database after Discord accepts it
            this._saveMessage(botId, channelId, guildId, 'assistant', replyContent);

        } catch (error) {
            console.error(`[CordBridge] API Error for bot "${config.name}":`, error.message);
            try {
                await this._sendTextReply(message, 'Sorry, I encountered an error while trying to process that request.');
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
     * Save a log entry for debugging and delete older logs if retention policy applies.
     */
    _saveLog(botId, guildId, type, contentObj, config) {
        try {
            const db = getDb();
            const retentionDaysRaw = config && config.log_retention_days !== undefined ? config.log_retention_days : 7;
            const retentionDays = Math.max(0, Number.parseInt(retentionDaysRaw, 10) || 0);
            
            // Cleanup older logs (skip if 0 means keep forever)
            if (retentionDays > 0) {
                db.prepare("DELETE FROM bot_logs WHERE bot_id = ? AND created_at < datetime('now', ?)").run(botId, `-${retentionDays} days`);
            }

            const contentStr = JSON.stringify(contentObj);
            db.prepare('INSERT INTO bot_logs (bot_id, guild_id, type, content) VALUES (?, ?, ?, ?)')
                .run(botId, guildId || 'DM', type, contentStr);
        } catch (err) {
            console.error('[CordBridge] Failed to save log:', err.message);
        }
    }

    _configFlag(value) {
        return value === true || value === 1 || value === '1' || value === 'true';
    }

    async _sendTextReply(message, content) {
        const chunks = this._splitDiscordMessage(content);
        for (let i = 0; i < chunks.length; i++) {
            if (i === 0) {
                await this._sendReplyPayload(message, chunks[i]);
            } else {
                try {
                    await message.channel.send(chunks[i]);
                } catch (err) {
                    console.error('[CordBridge] Failed to send follow-up chunk, retrying as reply:', err.message);
                    await this._sendReplyPayload(message, chunks[i]);
                }
            }
        }
    }

    async _sendReplyPayload(message, payload) {
        try {
            return await message.reply(payload);
        } catch (replyErr) {
            console.error('[CordBridge] Discord reply failed, retrying as channel message:', replyErr.message);
            try {
                return await message.channel.send(payload);
            } catch (sendErr) {
                console.error('[CordBridge] Discord channel send failed:', sendErr.message);
                throw sendErr;
            }
        }
    }

    _splitDiscordMessage(content) {
        let remaining = String(content || '').trim();
        if (!remaining) remaining = '...';

        const chunks = [];
        const maxChunkLength = DISCORD_MESSAGE_LIMIT - 10;
        while (remaining.length > DISCORD_MESSAGE_LIMIT) {
            let splitAt = remaining.lastIndexOf('\n', maxChunkLength);
            if (splitAt < 1000) splitAt = remaining.lastIndexOf(' ', maxChunkLength);
            if (splitAt < 1000) splitAt = maxChunkLength;

            const chunk = remaining.slice(0, splitAt).trimEnd();
            if (chunk) chunks.push(chunk);
            remaining = remaining.slice(splitAt).trimStart();
        }

        if (remaining) chunks.push(remaining);
        return chunks.length > 0 ? chunks : ['...'];
    }

    _isImageAttachment(att) {
        if (!att) return false;
        const contentType = (att.contentType || '').toLowerCase();
        if (contentType.startsWith('image/')) return true;
        if (att.width && att.height) return true;

        const name = (att.name || att.filename || att.url || '').toLowerCase();
        return /\.(png|jpe?g|gif|webp|bmp|avif)(?:[?#].*)?$/.test(name);
    }

    async _prepareImagesForVision(images) {
        const prepared = [];
        for (const image of images) {
            prepared.push(await this._prepareImageForVision(image));
        }
        return prepared;
    }

    async _prepareImageForVision(image) {
        const prepared = {
            ...image,
            originalUrl: image.url,
            visionUrl: image.url,
            fetchError: null
        };

        if (!image.url || image.url.startsWith('data:')) {
            return prepared;
        }

        try {
            prepared.visionUrl = await this._downloadImageAsDataUrl(image.url, image.contentType, image.filename);
        } catch (err) {
            prepared.fetchError = err.message;
            console.warn(`[CordBridge] Could not cache image locally for vision; falling back to original URL: ${err.message}`);
        }

        return prepared;
    }

    async _downloadImageAsDataUrl(url, contentTypeHint = '', filenameHint = '') {
        if (typeof fetch !== 'function') {
            throw new Error('fetch is not available in this Node.js runtime');
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);

        let response;
        try {
            response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'image/*,*/*;q=0.8',
                    'User-Agent': 'CordBridge/1.0'
                }
            });
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {
            throw new Error(`image fetch returned HTTP ${response.status}`);
        }

        const contentLength = Number(response.headers.get('content-length') || 0);
        if (contentLength > MAX_IMAGE_BYTES) {
            throw new Error(`image is too large (${contentLength} bytes)`);
        }

        const responseType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
        const hintedType = (contentTypeHint || '').split(';')[0].trim().toLowerCase();
        let mimeType = responseType || hintedType || this._mimeFromFilename(filenameHint || url);
        if (!mimeType || mimeType === 'application/octet-stream') {
            mimeType = this._mimeFromFilename(filenameHint || url);
        }
        if (!mimeType || !mimeType.startsWith('image/')) {
            throw new Error(`URL did not return an image (${responseType || 'unknown content type'})`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
            throw new Error(`image is too large (${arrayBuffer.byteLength} bytes)`);
        }

        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return `data:${mimeType};base64,${base64}`;
    }

    _mimeFromFilename(filename = '') {
        const cleanName = filename.toLowerCase().split('?')[0].split('#')[0];
        if (cleanName.endsWith('.png')) return 'image/png';
        if (cleanName.endsWith('.jpg') || cleanName.endsWith('.jpeg')) return 'image/jpeg';
        if (cleanName.endsWith('.gif')) return 'image/gif';
        if (cleanName.endsWith('.webp')) return 'image/webp';
        if (cleanName.endsWith('.bmp')) return 'image/bmp';
        if (cleanName.endsWith('.avif')) return 'image/avif';
        return '';
    }

    async _describeImageWithFallback(visionOpenai, visionModel, image) {
        if (!visionOpenai) {
            throw new Error('No vision provider is configured');
        }

        const urlsToTry = [];
        if (image.visionUrl) urlsToTry.push(image.visionUrl);
        if (image.originalUrl && image.originalUrl !== image.visionUrl) urlsToTry.push(image.originalUrl);

        const errors = [];
        for (const url of urlsToTry) {
            try {
                const visionResponse = await visionOpenai.chat.completions.create({
                    model: visionModel,
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: "Please provide a detailed, concise description of this image. Focus on the main subjects, actions, environment, and mood so that someone who cannot see it can understand it perfectly." },
                                { type: "image_url", image_url: { url } }
                            ]
                        }
                    ],
                    max_tokens: 500
                });
                const desc = visionResponse.choices[0]?.message?.content?.trim();
                if (desc) return desc;
                errors.push('vision model returned an empty description');
            } catch (err) {
                errors.push(err.message);
            }
        }

        throw new Error(errors.join(' | ') || 'image description failed');
    }

    async _createChatCompletionWithFallbacks(openai, apiParams, context) {
        const attempts = [{ label: 'primary', params: apiParams }];

        if (context.nativeOriginalUrlMessages) {
            attempts.push({
                label: 'with original image URLs',
                params: { ...apiParams, messages: context.nativeOriginalUrlMessages }
            });
        }

        if (apiParams.extra_body) {
            const withoutProviderOrder = { ...apiParams };
            delete withoutProviderOrder.extra_body;
            attempts.push({ label: 'without preferred provider order', params: withoutProviderOrder });

            if (context.nativeOriginalUrlMessages) {
                const originalUrlsWithoutProviderOrder = { ...apiParams, messages: context.nativeOriginalUrlMessages };
                delete originalUrlsWithoutProviderOrder.extra_body;
                attempts.push({
                    label: 'with original image URLs and without preferred provider order',
                    params: originalUrlsWithoutProviderOrder
                });
            }
        }

        if (context.nativeVisionInjected) {
            const textOnlyMessages = this._stripImagesFromMessages(
                apiParams.messages,
                '[Image handling note: the image payload could not be delivered to the chat provider on the first attempt, so this retry only has the text and saved image context.]'
            );
            attempts.push({
                label: 'without native image payloads',
                params: { ...apiParams, messages: textOnlyMessages }
            });

            if (apiParams.extra_body) {
                const textOnlyWithoutProviderOrder = { ...apiParams, messages: textOnlyMessages };
                delete textOnlyWithoutProviderOrder.extra_body;
                attempts.push({
                    label: 'without native image payloads or preferred provider order',
                    params: textOnlyWithoutProviderOrder
                });
            }
        }

        let lastError = null;
        for (let i = 0; i < attempts.length; i++) {
            const attempt = attempts[i];
            try {
                return await openai.chat.completions.create(attempt.params);
            } catch (err) {
                lastError = err;
                const nextAttempt = attempts[i + 1];
                if (nextAttempt) {
                    console.warn(`[CordBridge] API attempt "${attempt.label}" failed; retrying ${nextAttempt.label}:`, err.message);
                    this._saveLog(context.botId, context.guildId, 'api_retry', {
                        requestId: context.requestId,
                        failedAttempt: attempt.label,
                        nextAttempt: nextAttempt.label,
                        error: err.message
                    }, context.config);
                }
            }
        }

        throw lastError || new Error('All API attempts failed');
    }

    _replaceImagePayloads(messages, imageUrls) {
        let imageIndex = 0;
        return messages.map(message => {
            if (!Array.isArray(message.content)) {
                return { ...message };
            }

            return {
                ...message,
                content: message.content.map(part => {
                    if (!part || part.type !== 'image_url') return part && typeof part === 'object' ? { ...part } : part;
                    const url = imageUrls[imageIndex++] || part.image_url?.url;
                    return {
                        ...part,
                        image_url: {
                            ...(part.image_url || {}),
                            url
                        }
                    };
                })
            };
        });
    }

    _stripImagesFromMessages(messages, note) {
        return messages.map(message => {
            if (!Array.isArray(message.content)) {
                return { ...message };
            }

            const textParts = message.content
                .filter(part => part && part.type === 'text' && part.text)
                .map(part => part.text);

            return {
                ...message,
                content: `${textParts.join('\n')}\n\n${note}`.trim()
            };
        });
    }

    /**
     * Build the message context array from stored history.
     * Fits as many recent messages as the token budget allows,
     * and summarizes older overflow messages via an AI call.
     */
    async _buildContext(botId, channelId, config, openai, userText = '', discordMessage = null, requestId = null) {
        const db = getDb();
        const messages = [];
        const guildId = discordMessage?.guild?.id || 'DM';

        // 1a. Load stored conversation messages (capped to prevent loading thousands of rows into RAM)
        //     We load the most recent 200 messages — more than enough for token budgets
        const MSG_LOAD_LIMIT = 200;
        let allStoredMessages;
        if (guildId === 'DM') {
            allStoredMessages = db.prepare(
                'SELECT id, role, content, created_at FROM messages WHERE bot_id = ? AND (channel_id = ? OR (guild_id = ? AND role = ? AND content LIKE ?)) ORDER BY created_at DESC LIMIT ?'
            ).all(botId, channelId, 'DM', 'system', `${SUMMARY_MARKER}%`, MSG_LOAD_LIMIT).reverse();
        } else {
            allStoredMessages = db.prepare(
                'SELECT id, role, content, created_at FROM messages WHERE bot_id = ? AND guild_id = ? ORDER BY created_at DESC LIMIT ?'
            ).all(botId, guildId, MSG_LOAD_LIMIT).reverse();
        }

        const summaryRows = [];
        const conversationMessages = [];
        for (const storedMessage of allStoredMessages) {
            if (this._isSummaryMessage(storedMessage)) {
                summaryRows.push(storedMessage);
            } else {
                conversationMessages.push(storedMessage);
            }
        }
        const existingSummary = this._combineSummaryRows(summaryRows);

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

        // 2. We already fetched ALL stored messages above into allStoredMessages.
        //    Stored summaries are durable memory, not normal chat turns.
        if (conversationMessages.length === 0) {
            if (existingSummary) {
                messages.push({ role: "system", content: this._formatMemorySummary(existingSummary) });
            }
            return messages;
        }

        // 3. Token budget calculation
        const totalBudget = Math.max(500, Number.parseInt(config.max_prompt_tokens, 10) || 10000);
        let reservedTokens = 50; // Start with a 50 token safety margin

        // Account for all tokens already placed in the 'messages' array (system prompt, first message, cross-bot context, etc)
        for (const m of messages) {
            reservedTokens += this._estimateTokens(m.content);
        }
        
        // Add prefill token cost
        if (config.prefill && typeof config.prefill === 'string') {
            reservedTokens += this._estimateTokens(config.prefill);
        }

        if (existingSummary) {
            reservedTokens += Math.min(this._estimateTokens(this._formatMemorySummary(existingSummary)), 1800);
        }
        
        // Reserve an estimated 350 tokens for the AI summary string that will be injected if there is an overflow
        reservedTokens += 500;

        let availableBudget = totalBudget - reservedTokens;
        if (availableBudget < 200) availableBudget = 200; // minimum
        
        let totalStoredTokens = 0;
        for (const m of conversationMessages) totalStoredTokens += this._estimateTokens(m.content);

        // 4. Determine context to keep vs summarize
        const recentMessages = [];
        let cutoffIndex = 0;

        if (totalStoredTokens > availableBudget && conversationMessages.length > 1) {
            // Keep a generous recent tail so the bot continues from the current thread, not from its base prompt.
            const targetBudget = availableBudget * 0.7;
            const minRecentCount = Math.min(8, conversationMessages.length);
            let recentTokens = 0;
            
            for (let i = conversationMessages.length - 1; i >= 0; i--) {
                const msg = conversationMessages[i];
                const msgTokens = this._estimateTokens(msg.content);
                const isRequiredTail = i >= conversationMessages.length - minRecentCount;
                
                // Always preserve the very latest message (the user's prompt) so they don't lose context for this turn
                // Otherwise, stop when adding the next message would exceed our buffered target
                if (!isRequiredTail && i !== conversationMessages.length - 1 && recentTokens + msgTokens > targetBudget) {
                    cutoffIndex = i + 1;
                    break;
                }
                
                recentTokens += msgTokens;
                recentMessages.unshift({ role: msg.role, content: msg.content });
            }
        } else {
            // Fits entirely in budget
            for (const msg of conversationMessages) {
                recentMessages.push({ role: msg.role, content: msg.content });
            }
        }

        // 5. If there are older messages that didn't fit, summarize them and save to DB
        if (cutoffIndex > 0) {
            const oldMessages = conversationMessages.slice(0, cutoffIndex);
            const summaryMaxTokens = Math.max(300, Math.min(1800, Math.floor(availableBudget * 0.35)));

            try {
                const summary = await this._summarizeMessages(oldMessages, openai, config.model, summaryMaxTokens, existingSummary);
                if (summary) {
                    const summaryContent = this._formatMemorySummary(summary);
                    
                    messages.push({
                        role: "system",
                        content: summaryContent
                    });
                    
                    // Permanent buffer swap in DB: delete summarized messages, insert the new summary
                    const oldIds = [...summaryRows.map(m => m.id), ...oldMessages.map(m => m.id)];
                    if (oldIds.length > 0) {
                        try {
                            const placeholders = oldIds.map(() => '?').join(',');
                            db.prepare(`DELETE FROM messages WHERE id IN (${placeholders})`).run(...oldIds);
                            
                            // Insert new summary using the timestamp of the last summarized message so it stays in order
                            const lastOldMsg = oldMessages[oldMessages.length - 1];
                            db.prepare('INSERT INTO messages (bot_id, channel_id, guild_id, role, content, created_at) VALUES (?, ?, ?, ?, ?, ?)')
                                .run(botId, channelId, guildId, 'system', summaryContent, lastOldMsg.created_at);
                        } catch (dbErr) {
                            console.error('[CordBridge] Failed to save summary to DB:', dbErr.message);
                        }
                    }
                } else {
                    messages.push({
                        role: "system",
                        content: this._formatMemorySummary(this._buildFallbackSummary(oldMessages, existingSummary))
                    });
                }
            } catch (err) {
                console.error('[CordBridge] Summary generation failed, using local fallback memory:', err.message);
                messages.push({
                    role: "system",
                    content: this._formatMemorySummary(this._buildFallbackSummary(oldMessages, existingSummary))
                });
            }
        } else if (existingSummary) {
            messages.push({ role: "system", content: this._formatMemorySummary(existingSummary) });
        }

        // 6. Append the recent messages (verbatim)
        messages.push(...recentMessages);

        // 7. Ambient channel context: fetch recent Discord messages for situational awareness
        // Placed at the very end so it chronologically represents immediate surrounding events
        const channelContext = await this._fetchChannelContext(botId, discordMessage, allStoredMessages);
        if (channelContext) {
            messages.push({ role: "system", content: channelContext });
        }

        let totalTks = 0;
        messages.forEach(m => totalTks += this._estimateTokens(this._contentForTokenEstimate(m.content)));
        
        this._saveLog(botId, guildId, 'context_built', {
            requestId,
            channelId,
            totalTokens: totalTks,
            messageCount: messages.length,
            messagesIncluded: messages.map(m => m.role)
        }, config);

        return messages;
    }

    _isSummaryMessage(message) {
        return message?.role === 'system' && typeof message.content === 'string' && message.content.startsWith(SUMMARY_MARKER);
    }

    _stripSummaryMarker(content = '') {
        return content
            .replace(SUMMARY_MARKER, '')
            .replace(SUMMARY_INSTRUCTIONS, '')
            .trim();
    }

    _combineSummaryRows(summaryRows) {
        if (!summaryRows || summaryRows.length === 0) return '';
        return summaryRows
            .map(row => this._stripSummaryMarker(row.content))
            .filter(Boolean)
            .join('\n\n');
    }

    _formatMemorySummary(summary) {
        const cleanSummary = this._stripSummaryMarker(summary);
        return `${SUMMARY_MARKER}\n${SUMMARY_INSTRUCTIONS}\n\n${cleanSummary}`.trim();
    }

    _buildFallbackSummary(oldMessages, existingSummary = '') {
        const tail = oldMessages.slice(-20).map(m => {
            const label = m.role === 'user' ? 'User' : (m.role === 'assistant' ? 'Bot' : 'System');
            return `${label}: ${m.content}`;
        }).join('\n');

        const parts = [];
        if (existingSummary) parts.push(`Existing durable memory:\n${existingSummary}`);
        if (tail) parts.push(`Recent older transcript retained because AI summarization failed:\n${tail}`);
        return parts.join('\n\n').slice(0, 6000);
    }

    /**
     * Ask the AI to summarize a list of older messages into a compact paragraph.
     */
    async _summarizeMessages(oldMessages, openai, model, maxTokens, existingSummary = '') {
        const transcript = oldMessages.map(m => {
            const label = m.role === 'user' ? 'User' : (m.role === 'assistant' ? 'Bot' : 'System');
            return `${label}: ${m.content}`;
        }).join('\n');

        // Truncate the transcript itself if absurdly long (>40k chars ≈ 10k tokens)
        const truncatedTranscript = transcript.length > 40000
            ? transcript.substring(0, 40000) + '\n... [older messages truncated]'
            : transcript;

        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: "system",
                    content: "You maintain durable memory for a Discord character bot. Update the memory so the bot can continue later without resetting to a first-message or base-prompt state. Preserve concrete names, identities, relationships, emotional dynamics, preferences, promises, unresolved threads, decisions, images/files that were discussed, and current conversation momentum. Keep it compact but specific. Do not roleplay and do not add facts that are not supported."
                },
                {
                    role: "user",
                    content: [
                        existingSummary ? `Existing durable memory:\n${existingSummary}` : 'Existing durable memory: none yet.',
                        `New transcript to merge:\n${truncatedTranscript}`,
                        'Return only updated durable memory with short labeled sections: Current situation, People and relationships, Important facts and preferences, Open threads, Image/file context, Tone and continuity cues.'
                    ].join('\n\n')
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
    _contentForTokenEstimate(content) {
        if (Array.isArray(content)) {
            return content.map(part => {
                if (part?.type === 'text') return part.text || '';
                if (part?.type === 'image_url') return '[image attachment]';
                return '';
            }).join('\n');
        }
        return content;
    }

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
