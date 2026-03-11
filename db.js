const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

let db;

function getDb() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        initTables();
    }
    return db;
}

function initTables() {
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
            provider_id INTEGER,
            model TEXT NOT NULL DEFAULT 'deepseek/deepseek-v3.2',
            system_prompt TEXT DEFAULT '',
            character_prompt TEXT DEFAULT '',
            prefill TEXT DEFAULT '',
            temperature REAL DEFAULT 0.9,
            top_p REAL DEFAULT 0.9,
            max_tokens INTEGER DEFAULT 300,
            max_prompt_tokens INTEGER DEFAULT 10000,
            presence_penalty REAL DEFAULT 0.0,
            frequency_penalty REAL DEFAULT 0.0,
            auto_start INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL
        );
    `);
}

module.exports = { getDb };
