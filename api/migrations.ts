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
        reference TEXT NOT NULL,
        location TEXT NOT NULL,
        seized_on date NOT NULL,
        reported_on date NOT NULL DEFAULT ( strftime('%Y-%m-%d') ),
        user_id INTEGER NOT NULL,
        FOREIGN KEY (user_id)
          REFERENCES users (id)
      );
    `)
  },
  (db: DatabaseSync) => {
    db.exec(`
      CREATE TABLE substances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        amount FLOAT NOT NULL,
        unit TEXT NOT NULL,
        seizure_id INTEGER NOT NULL,
        FOREIGN KEY (seizure_id)
          REFERENCES seizures (id)
      );
    `)
  },
]
