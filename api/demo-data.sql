CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS magic_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (user_id)
    REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS seizures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL,
  location TEXT NOT NULL,
  seized_on date NOT NULL,
  reported_on date NOT NULL DEFAULT ( strftime('%Y-%m-%d') ),
  user_id INTEGER NOT NULL,
  FOREIGN KEY (user_id)
    REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS substances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount FLOAT NOT NULL,
  unit TEXT NOT NULL,
  seizure_id INTEGER NOT NULL,
  FOREIGN KEY (seizure_id)
    REFERENCES seizures (id)
);

INSERT INTO users (email) values ('test@example.com');

INSERT INTO seizures (reference, location, reported_on, seized_on, user_id) VALUES ('#12345', '123 Main St.', '2025-09-18','2025-09-18', 1);

INSERT INTO substances (name, category, amount, unit, seizure_id) VALUES ('iocaine powder', 'controlled substance', 4.9, 'grams', 1);
INSERT INTO substances (name, category, amount, unit, seizure_id) VALUES ('phlogiston', 'controlled substance', 7, 'capsules', 1);
