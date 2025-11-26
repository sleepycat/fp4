import { DatabaseSync } from "node:sqlite"
import type { User } from "../types/User.ts"

export function findOrCreateUser(
  db: DatabaseSync,
  email: string,
): User | undefined {
  let user
  db.exec("BEGIN TRANSACTION;")
  try {
    const insert = db.prepare(
      "INSERT INTO users (email, created_at) VALUES (@email, DATE('now')) ON CONFLICT(email) DO NOTHING;",
    )
    const select = db.prepare("SELECT * FROM users WHERE email = @email;")

    insert.run({ email })

    user = select.get({ email })
    db.exec("COMMIT;")
    return user as User
  } catch (e) {
    db.exec("ROLLBACK")
    console.error({ rollback: true, error: e })
    return undefined
  }
}
