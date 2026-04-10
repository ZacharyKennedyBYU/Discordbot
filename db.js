const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

let db = null;

/**
 * Initialize the database connection and create tables if needed.
 * Uses Node.js built-in node:sqlite (on-disk SQLite) — no in-memory copies,
 * no manual _save() calls, dramatically lower RAM usage vs sql.js.
 */
async function initDb() {
    if (db) return db;

    db = new DatabaseSync(DB_PATH);

    // Enable WAL mode for better concurrent read/write performance
    // (especially helpful on Pi SD cards — fewer fsync calls)
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');

    console.log('[DB] Opened database (node:sqlite, WAL mode).');

    _initTables();

    return db;
}

/** Get the database instance (must call initDb() first at startup) */
function getDb() {
    if (!db) {
        throw new Error('Database not initialized. Call initDb() first.');
    }
    return db;
}

function _initTables() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS providers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            base_url TEXT NOT NULL DEFAULT 'https://openrouter.ai/api/v1',
            api_key TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS bots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            discord_token TEXT NOT NULL,
            bot_type TEXT DEFAULT 'real',
            false_phrases TEXT DEFAULT '[]',
            provider_id INTEGER,
            vision_provider_id INTEGER,
            model TEXT NOT NULL DEFAULT 'deepseek/deepseek-v3.2',
            vision_model TEXT DEFAULT '',
            use_chat_vision INTEGER DEFAULT 0,
            system_prompt TEXT DEFAULT '',
            character_prompt TEXT DEFAULT '',
            first_message TEXT DEFAULT '',
            example_messages TEXT DEFAULT '',
            prefill TEXT DEFAULT '',
            temperature REAL DEFAULT 0.9,
            top_p REAL DEFAULT 0.9,
            max_tokens INTEGER DEFAULT 300,
            max_prompt_tokens INTEGER DEFAULT 10000,
            presence_penalty REAL DEFAULT 0.0,
            frequency_penalty REAL DEFAULT 0.0,
            auto_start INTEGER DEFAULT 0,
            allowed_guilds TEXT DEFAULT '[]',
            providers_order TEXT DEFAULT '[]',
            log_retention_days INTEGER DEFAULT 7,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_id INTEGER NOT NULL,
            guild_id TEXT DEFAULT '',
            channel_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_messages_lookup
            ON messages(bot_id, channel_id, created_at);

        CREATE TABLE IF NOT EXISTS lorebooks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            data TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS bot_lorebooks (
            bot_id INTEGER NOT NULL,
            lorebook_id INTEGER NOT NULL,
            overrides TEXT DEFAULT '{}',
            PRIMARY KEY (bot_id, lorebook_id),
            FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE,
            FOREIGN KEY (lorebook_id) REFERENCES lorebooks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS bot_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_id INTEGER NOT NULL,
            guild_id TEXT DEFAULT 'DM',
            type TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
        );
    `);

    // Migration: add columns to existing databases (safe to run repeatedly)
    const migrations = [
        'ALTER TABLE bots ADD COLUMN first_message TEXT DEFAULT ""',
        'ALTER TABLE bots ADD COLUMN example_messages TEXT DEFAULT ""',
        'ALTER TABLE messages ADD COLUMN guild_id TEXT DEFAULT ""',
        'ALTER TABLE bots ADD COLUMN vision_model TEXT DEFAULT ""',
        'ALTER TABLE bots ADD COLUMN vision_provider_id INTEGER',
        'ALTER TABLE bots ADD COLUMN bot_type TEXT DEFAULT "real"',
        'ALTER TABLE bots ADD COLUMN false_phrases TEXT DEFAULT "[]"',
        'ALTER TABLE bots ADD COLUMN use_chat_vision INTEGER DEFAULT 0',
        'ALTER TABLE bots ADD COLUMN allowed_guilds TEXT DEFAULT "[]"',
        'ALTER TABLE bots ADD COLUMN providers_order TEXT DEFAULT "[]"',
        'ALTER TABLE bots ADD COLUMN log_retention_days INTEGER DEFAULT 7',
    ];

    for (const sql of migrations) {
        try { db.exec(sql); } catch (_) { /* Column already exists — ignore */ }
    }

    // Add index for guild-based message queries (used by server-wide memory)
    try {
        db.exec('CREATE INDEX IF NOT EXISTS idx_messages_guild ON messages(bot_id, guild_id, created_at)');
    } catch (_) { }
}

module.exports = { initDb, getDb };
