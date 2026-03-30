require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { initDb, getDb } = require('./db');
const BotManager = require('./BotManager');

const app = express();
const PORT = process.env.PORT || 3000;
const botManager = new BotManager();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));

// Setup file uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage: storage });

// Serve static uploads
app.use('/uploads', express.static(uploadsDir));

// Serve the built frontend in production
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// ─────────────────────────────────────────────
//  Upload API
// ─────────────────────────────────────────────

// POST to upload an audio file
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: path.join('uploads', req.file.filename), // relative path
        url: `/uploads/${req.file.filename}`
    });
});

// ─────────────────────────────────────────────
//  Provider API Routes
// ─────────────────────────────────────────────

// GET all providers (hides API key)
app.get('/api/providers', (req, res) => {
    const db = getDb();
    const providers = db.prepare('SELECT id, name, base_url, created_at FROM providers').all();
    res.json(providers);
});

// GET a single provider (hides API key)
app.get('/api/providers/:id', (req, res) => {
    const db = getDb();
    const provider = db.prepare('SELECT id, name, base_url, created_at FROM providers WHERE id = ?').get(req.params.id);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });
    res.json(provider);
});

// POST create a provider
app.post('/api/providers', (req, res) => {
    const { name, base_url, api_key } = req.body;
    if (!name || !api_key) return res.status(400).json({ error: 'name and api_key are required.' });
    const db = getDb();
    const result = db.prepare('INSERT INTO providers (name, base_url, api_key) VALUES (?, ?, ?)').run(
        name,
        base_url || 'https://openrouter.ai/api/v1',
        api_key
    );
    res.json({ id: result.lastInsertRowid, name, base_url: base_url || 'https://openrouter.ai/api/v1' });
});

// PUT update a provider
app.put('/api/providers/:id', (req, res) => {
    const { name, base_url, api_key } = req.body;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM providers WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Provider not found' });

    const newName = name || existing.name;
    const newUrl = base_url || existing.base_url;
    const newKey = api_key || existing.api_key; // only update key if a new one is provided

    db.prepare('UPDATE providers SET name = ?, base_url = ?, api_key = ? WHERE id = ?').run(newName, newUrl, newKey, req.params.id);

    // Reload config for any running bots using this provider
    const botsUsingProvider = db.prepare('SELECT id FROM bots WHERE provider_id = ?').all(req.params.id);
    for (const bot of botsUsingProvider) {
        botManager.reloadConfig(bot.id);
    }

    res.json({ id: parseInt(req.params.id), name: newName, base_url: newUrl });
});

// DELETE a provider
app.delete('/api/providers/:id', (req, res) => {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM providers WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Provider not found' });
    db.prepare('DELETE FROM providers WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// GET available models from a provider's API
app.get('/api/providers/:id/models', async (req, res) => {
    const db = getDb();
    const provider = db.prepare('SELECT * FROM providers WHERE id = ?').get(req.params.id);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });

    try {
        const response = await fetch(`${provider.base_url}/models`, {
            headers: {
                'Authorization': `Bearer ${provider.api_key}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            return res.status(response.status).json({ error: `Provider API responded with ${response.status}` });
        }
        
        const data = await response.json();
        // Return exactly what the provider returns (usually { data: [ { id: "gpt-4" }, ... ] })
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch models from provider: ' + err.message });
    }
});

// ─────────────────────────────────────────────
//  Bot API Routes
// ─────────────────────────────────────────────

// GET all bots (with online status, hides discord token)
app.get('/api/bots', (req, res) => {
    const db = getDb();
    const bots = db.prepare(`
        SELECT b.id, b.name, b.model, b.provider_id, b.use_chat_vision, b.auto_start, b.created_at,
               p.name as provider_name
        FROM bots b
        LEFT JOIN providers p ON b.provider_id = p.id
    `).all();

    const result = bots.map(bot => ({
        ...bot,
        online: botManager.isOnline(bot.id),
    }));
    res.json(result);
});

// GET a single bot's full config (hides discord token and provider api key)
app.get('/api/bots/:id', (req, res) => {
    const db = getDb();
    const bot = db.prepare(`
        SELECT b.*, p.name as provider_name, p.base_url as provider_url
        FROM bots b
        LEFT JOIN providers p ON b.provider_id = p.id
        WHERE b.id = ?
    `).get(req.params.id);
    if (!bot) return res.status(404).json({ error: 'Bot not found' });

    // Don't expose the discord token to the frontend
    const { discord_token, ...safeBotData } = bot;
    res.json({
        ...safeBotData,
        has_token: !!discord_token,
        online: botManager.isOnline(bot.id),
    });
});

// POST create a bot
app.post('/api/bots', (req, res) => {
    const { name, discord_token, bot_type, false_phrases, provider_id, vision_provider_id, model, vision_model, use_chat_vision, system_prompt, character_prompt, first_message, example_messages, prefill,
        temperature, top_p, max_tokens, max_prompt_tokens, presence_penalty, frequency_penalty, auto_start } = req.body;

    if (!name || !discord_token) return res.status(400).json({ error: 'name and discord_token are required.' });

    const db = getDb();
    const result = db.prepare(`
        INSERT INTO bots (name, discord_token, bot_type, false_phrases, provider_id, vision_provider_id, model, vision_model, use_chat_vision, system_prompt, character_prompt, first_message, example_messages, prefill,
            temperature, top_p, max_tokens, max_prompt_tokens, presence_penalty, frequency_penalty, auto_start)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        name,
        discord_token,
        bot_type || 'real',
        false_phrases || '[]',
        provider_id || null,
        vision_provider_id || null,
        model || 'deepseek/deepseek-v3.2',
        vision_model || '',
        use_chat_vision ? 1 : 0,
        system_prompt || '',
        character_prompt || '',
        first_message || '',
        example_messages || '',
        prefill || '',
        temperature ?? 0.9,
        top_p ?? 0.9,
        max_tokens ?? 300,
        max_prompt_tokens ?? 10000,
        presence_penalty ?? 0.0,
        frequency_penalty ?? 0.0,
        auto_start ? 1 : 0
    );
    res.json({ id: result.lastInsertRowid, name });
});

// PUT update a bot
app.put('/api/bots/:id', (req, res) => {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM bots WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Bot not found' });

    const fields = ['name', 'discord_token', 'bot_type', 'false_phrases', 'provider_id', 'vision_provider_id', 'model', 'vision_model', 'use_chat_vision', 'system_prompt', 'character_prompt',
        'first_message', 'example_messages', 'prefill', 'temperature', 'top_p', 'max_tokens', 'max_prompt_tokens', 'presence_penalty', 'frequency_penalty', 'auto_start'];

    const updates = {};
    for (const field of fields) {
        if (req.body[field] !== undefined) {
            updates[field] = (field === 'auto_start' || field === 'use_chat_vision') ? (req.body[field] ? 1 : 0) : req.body[field];
        } else {
            updates[field] = existing[field];
        }
    }

    db.prepare(`
        UPDATE bots SET name=?, discord_token=?, bot_type=?, false_phrases=?, provider_id=?, vision_provider_id=?, model=?, vision_model=?, use_chat_vision=?, system_prompt=?, character_prompt=?,
            first_message=?, example_messages=?, prefill=?, temperature=?, top_p=?, max_tokens=?, max_prompt_tokens=?, presence_penalty=?, frequency_penalty=?, auto_start=?
        WHERE id = ?
    `).run(
        updates.name, updates.discord_token, updates.bot_type, updates.false_phrases, updates.provider_id, updates.vision_provider_id, updates.model, updates.vision_model, updates.use_chat_vision,
        updates.system_prompt, updates.character_prompt, updates.first_message, updates.example_messages, updates.prefill,
        updates.temperature, updates.top_p, updates.max_tokens, updates.max_prompt_tokens,
        updates.presence_penalty, updates.frequency_penalty, updates.auto_start,
        req.params.id
    );

    // Reload config for running bot
    botManager.reloadConfig(parseInt(req.params.id));

    res.json({ success: true });
});

// DELETE a bot
app.delete('/api/bots/:id', async (req, res) => {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM bots WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Bot not found' });

    // Stop it first if running
    if (botManager.isOnline(parseInt(req.params.id))) {
        await botManager.stopBot(parseInt(req.params.id));
    }

    db.prepare('DELETE FROM bots WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// POST start a bot
app.post('/api/bots/:id/start', async (req, res) => {
    const result = await botManager.startBot(parseInt(req.params.id));
    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

// POST stop a bot
app.post('/api/bots/:id/stop', async (req, res) => {
    const result = await botManager.stopBot(parseInt(req.params.id));
    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

// GET list servers a bot has history in
app.get('/api/bots/:id/history', (req, res) => {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM bots WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Bot not found' });

    const servers = db.prepare(`
        SELECT guild_id, COUNT(*) as message_count
        FROM messages WHERE bot_id = ?
        GROUP BY guild_id
        ORDER BY MAX(created_at) DESC
    `).all(req.params.id);

    res.json(servers);
});

// DELETE clear a bot's conversation history (optionally filtered by guild_id)
app.delete('/api/bots/:id/history', (req, res) => {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM bots WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Bot not found' });

    const guildId = req.query.guild_id;
    let result;
    if (guildId) {
        result = db.prepare('DELETE FROM messages WHERE bot_id = ? AND guild_id = ?').run(req.params.id, guildId);
        console.log(`[CordBridge] Cleared history for bot id=${req.params.id} guild=${guildId} (${result.changes} messages removed)`);
    } else {
        result = db.prepare('DELETE FROM messages WHERE bot_id = ?').run(req.params.id);
        console.log(`[CordBridge] Cleared ALL history for bot id=${req.params.id} (${result.changes} messages removed)`);
    }
    res.json({ success: true, messagesRemoved: result.changes });
});

// ─────────────────────────────────────────────
//  Lorebook API Routes
// ─────────────────────────────────────────────

// GET all lorebooks
app.get('/api/lorebooks', (req, res) => {
    const db = getDb();
    const lorebooks = db.prepare('SELECT id, name, data, created_at FROM lorebooks').all();
    // Add entry count from parsed data
    const result = lorebooks.map(lb => {
        let entryCount = 0;
        try {
            const parsed = JSON.parse(lb.data || '{}');
            if (parsed.entries) entryCount = Object.keys(parsed.entries).length;
        } catch (_) {}
        return { id: lb.id, name: lb.name, entry_count: entryCount, created_at: lb.created_at };
    });
    res.json(result);
});

// GET a single lorebook with full data
app.get('/api/lorebooks/:id', (req, res) => {
    const db = getDb();
    const lb = db.prepare('SELECT * FROM lorebooks WHERE id = ?').get(req.params.id);
    if (!lb) return res.status(404).json({ error: 'Lorebook not found' });
    res.json(lb);
});

// POST create a lorebook
app.post('/api/lorebooks', (req, res) => {
    const { name, data } = req.body;
    if (!name || !data) return res.status(400).json({ error: 'name and data are required.' });

    // Validate JSON structure
    let parsed;
    try {
        parsed = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON data.' });
    }

    if (!parsed.entries) {
        return res.status(400).json({ error: 'Lorebook JSON must contain an "entries" object.' });
    }

    const db = getDb();
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
    const result = db.prepare('INSERT INTO lorebooks (name, data) VALUES (?, ?)').run(name, jsonStr);
    res.json({ id: result.lastInsertRowid, name });
});

// DELETE a lorebook
app.delete('/api/lorebooks/:id', (req, res) => {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM lorebooks WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Lorebook not found' });
    db.prepare('DELETE FROM lorebooks WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// GET lorebooks attached to a bot
app.get('/api/bots/:id/lorebooks', (req, res) => {
    const db = getDb();
    const rows = db.prepare(`
        SELECT bl.lorebook_id, bl.overrides, l.name, l.data
        FROM bot_lorebooks bl
        JOIN lorebooks l ON bl.lorebook_id = l.id
        WHERE bl.bot_id = ?
    `).all(req.params.id);
    res.json(rows);
});

// POST attach a lorebook to a bot
app.post('/api/bots/:id/lorebooks', (req, res) => {
    const { lorebook_id } = req.body;
    if (!lorebook_id) return res.status(400).json({ error: 'lorebook_id is required.' });

    const db = getDb();
    const bot = db.prepare('SELECT id FROM bots WHERE id = ?').get(req.params.id);
    if (!bot) return res.status(404).json({ error: 'Bot not found' });
    const lb = db.prepare('SELECT id FROM lorebooks WHERE id = ?').get(lorebook_id);
    if (!lb) return res.status(404).json({ error: 'Lorebook not found' });

    // Check if already attached
    const existing = db.prepare('SELECT * FROM bot_lorebooks WHERE bot_id = ? AND lorebook_id = ?').get(req.params.id, lorebook_id);
    if (existing) return res.status(400).json({ error: 'Lorebook is already attached to this bot.' });

    db.prepare('INSERT INTO bot_lorebooks (bot_id, lorebook_id, overrides) VALUES (?, ?, ?)').run(req.params.id, lorebook_id, '{}');
    res.json({ success: true });
});

// PUT update lorebook overrides for a bot
app.put('/api/bots/:id/lorebooks/:lorebookId', (req, res) => {
    const { overrides } = req.body;
    if (overrides === undefined) return res.status(400).json({ error: 'overrides is required.' });

    const db = getDb();
    const existing = db.prepare('SELECT * FROM bot_lorebooks WHERE bot_id = ? AND lorebook_id = ?').get(req.params.id, req.params.lorebookId);
    if (!existing) return res.status(404).json({ error: 'Bot-lorebook association not found.' });

    const overridesStr = typeof overrides === 'string' ? overrides : JSON.stringify(overrides);
    db.prepare('UPDATE bot_lorebooks SET overrides = ? WHERE bot_id = ? AND lorebook_id = ?').run(overridesStr, req.params.id, req.params.lorebookId);
    res.json({ success: true });
});

// DELETE detach a lorebook from a bot
app.delete('/api/bots/:id/lorebooks/:lorebookId', (req, res) => {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM bot_lorebooks WHERE bot_id = ? AND lorebook_id = ?').get(req.params.id, req.params.lorebookId);
    if (!existing) return res.status(404).json({ error: 'Bot-lorebook association not found.' });
    db.prepare('DELETE FROM bot_lorebooks WHERE bot_id = ? AND lorebook_id = ?').run(req.params.id, req.params.lorebookId);
    res.json({ success: true });
});

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// ─────────────────────────────────────────────
//  Start
// ─────────────────────────────────────────────
// ── Async startup (sql.js needs async init) ──
(async () => {
    await initDb();

    app.listen(PORT, '0.0.0.0', async () => {
        console.log(`\n  ╔═══════════════════════════════════════╗`);
        console.log(`  ║        CordBridge is running!          ║`);
        console.log(`  ║   Dashboard: http://localhost:${PORT}      ║`);
        console.log(`  ╚═══════════════════════════════════════╝\n`);

        // Auto-start bots
        await botManager.autoStartAll();
    });
})();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n[CordBridge] Shutting down...');
    await botManager.stopAll();
    process.exit(0);
});
