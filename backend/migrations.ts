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
]
