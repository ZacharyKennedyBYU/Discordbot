const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

let db = null;
let SQL = null;

/**
 * Thin wrapper around sql.js that mimics the better-sqlite3 API
 * so that server.js and BotManager.js don't need any changes.
 */
class Statement {
    constructor(database, sql) {
        this._db = database;
        this._sql = sql;
    }

    /** Run a query that returns rows (SELECT). Returns all matching rows. */
    all(...params) {
        try {
            const stmt = this._db.prepare(this._sql);
            if (params.length) stmt.bind(params);
            const rows = [];
            while (stmt.step()) {
                rows.push(stmt.getAsObject());
            }
            stmt.free();
            return rows;
        } catch (err) {
            console.error('[DB] Error in .all():', err.message, '| SQL:', this._sql);
            throw err;
        }
    }

    /** Run a query that returns a single row. Returns the row or undefined. */
    get(...params) {
        try {
            const stmt = this._db.prepare(this._sql);
            if (params.length) stmt.bind(params);
            let row = undefined;
            if (stmt.step()) {
                row = stmt.getAsObject();
            }
            stmt.free();
            return row;
        } catch (err) {
            console.error('[DB] Error in .get():', err.message, '| SQL:', this._sql);
            throw err;
        }
    }

    /** Run a query that modifies data (INSERT/UPDATE/DELETE). Returns { changes, lastInsertRowid }. */
    run(...params) {
        try {
            const stmt = this._db.prepare(this._sql);
            if (params.length) stmt.bind(params);
            stmt.step();
            stmt.free();
            // Persist to disk after every write
            const changes = this._db.getRowsModified();
            const lastId = this._db.exec("SELECT last_insert_rowid() as id");
            const lastInsertRowid = lastId.length > 0 ? lastId[0].values[0][0] : 0;
            _save();
            return { changes, lastInsertRowid };
        } catch (err) {
            console.error('[DB] Error in .run():', err.message, '| SQL:', this._sql);
            throw err;
        }
    }
}

class DatabaseWrapper {
    constructor(sqlDb) {
        this._db = sqlDb;
    }

    prepare(sql) {
        return new Statement(this._db, sql);
    }

    exec(sql) {
        this._db.run(sql);
        _save();
    }

    pragma(pragmaStr) {
        try {
            this._db.run(`PRAGMA ${pragmaStr}`);
        } catch (_) {
            // Some pragmas (like WAL) aren't supported in sql.js, silently skip
        }
    }
}

/** Save the in-memory database to disk */
function _save() {
    if (!db) return;
    try {
        const data = db._db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
    } catch (err) {
        console.error('[DB] Error saving database:', err.message);
    }
}

/** Initialize sql.js and load/create the database */
async function initDb() {
    if (db) return db;

    SQL = await initSqlJs();

    // Load existing database from disk, or create a new one
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new DatabaseWrapper(new SQL.Database(fileBuffer));
        console.log('[DB] Loaded existing database from disk.');
    } else {
        db = new DatabaseWrapper(new SQL.Database());
        console.log('[DB] Created new database.');
    }

    db.pragma('foreign_keys = ON');
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
            provider_id INTEGER,
            model TEXT NOT NULL DEFAULT 'deepseek/deepseek-v3.2',
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
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_id INTEGER NOT NULL,
            channel_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_messages_lookup
            ON messages(bot_id, channel_id, created_at);
    `);

    // Migration: add first_message column to existing databases
    try {
        db.exec('ALTER TABLE bots ADD COLUMN first_message TEXT DEFAULT ""');
    } catch (_) {
        // Column already exists — ignore
    }
    try {
        db.exec('ALTER TABLE bots ADD COLUMN example_messages TEXT DEFAULT ""');
    } catch (_) {
        // Column already exists — ignore
    }
}

module.exports = { initDb, getDb };
