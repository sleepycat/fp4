import { DatabaseSync, SQLOutputValue } from "node:sqlite"
import { migrate as sqlitemigrate } from "jsr:@gordonb/sqlite-migrate"
import migrations from "../migrations.ts"

export function migrate(db: DatabaseSync) {
  const result = sqlitemigrate(db, migrations)

  console.log(`Migrated to version ${result.version}`)

  if (result.error) {
    console.error("Migration failed:", result.error)
  }

  db.close()
}

export type DataAccessors = ReturnType<typeof dataAccessors>

export function dataAccessors(db: DatabaseSync) {
  function findOrCreateUser(
    email: string,
  ): Record<string, SQLOutputValue> | undefined {
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
      return user
    } catch (e) {
      db.exec("ROLLBACK")
      console.error({ rollback: true, error: e })
      return undefined
    }
  }

  function consumeMagicLink(
    hash: string,
  ): {
    err: false | string
    results: Record<string, SQLOutputValue> | undefined
  } {
    try {
      const results = db.prepare(
        "DELETE FROM magic_links WHERE token_hash = ? RETURNING email;",
      ).get(hash)
      return { err: false, results }
    } catch (e: unknown) {
      if (e instanceof Error) {
        return { err: e.message, results: undefined }
      } else {
        return { err: String(e), results: undefined }
      }
    }
  }

  function deleteHash(hash: string) {
    try {
      const results = db.prepare(
        "DELETE FROM magic_links WHERE token_hash = ?;",
      ).run(hash)
      return { err: false, results }
    } catch (e: unknown) {
      if (e instanceof Error) {
        return { err: e.message, results: {} }
      } else {
        return { err: e, results: {} }
      }
    }
  }

  // TODO: this is duplicated in Context.ts. Extract.
  interface saveHashArguments {
    hash: string
    email: string
  }

  function saveHash({ hash, email }: saveHashArguments) {
    try {
      return db.prepare(
        "INSERT INTO magic_links (email, token_hash) VALUES (@email, @hash);",
      ).run({ email, hash })
    } catch (e) {
      // TODO: do better here.
      console.error({ rollback: true, error: e })
      return undefined
    }
  }

  return {
    findOrCreateUser,
    consumeMagicLink,
    saveHash,
    deleteHash,
  }
}
