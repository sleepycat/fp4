import { DatabaseSync } from "node:sqlite"
export default [
  (db: DatabaseSync) => {
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT current_timestamp
      );
    `)
  },
  (db: DatabaseSync) => {
    db.exec(`
      CREATE TABLE magic_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_hash TEXT NOT NULL UNIQUE,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (user_id)
          REFERENCES users (id)
      );
    `)
  },
  (db: DatabaseSync) => {
    db.exec(`
      CREATE TABLE seizures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        substance TEXT NOT NULL,
        amount TEXT NOT NULL,
        seized_on date NOT NULL,
        reported_on date NOT NULL,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (user_id)
          REFERENCES users (id)
      );
    `)
  },
]
