import { DatabaseSync } from "node:sqlite"
export default [
  (db: DatabaseSync) => {
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        created_at TEXT
      );
    `)
  },
  (db: DatabaseSync) => {
    db.exec(`
      CREATE TABLE magic_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_hash TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL
      );
    `)
  },
]
