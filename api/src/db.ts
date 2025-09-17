import { DatabaseSync, SQLOutputValue } from "node:sqlite"
import { migrate as sqlitemigrate } from "jsr:@gordonb/sqlite-migrate"
import migrations from "../migrations.ts"
import { StatementResultingChanges } from "node:sqlite"

export function migrate(db: DatabaseSync) {
  const result = sqlitemigrate(db, migrations)

  console.log(`Migrated to version ${result.version}`)

  if (result.error) {
    console.error("Migration failed:", result.error)
  }

  db.close()
}

export type User = {
  id: number
  email: string
  created_at: string
}

export type DataAccessors = ReturnType<typeof dataAccessors>

export function dataAccessors(db: DatabaseSync) {
  function findOrCreateUser(
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

  function consumeMagicLink(
    hash: string,
  ): {
    err: false | string
    results: User | undefined
  } {
    db.exec("BEGIN TRANSACTION;")
    try {
      const consume = db.prepare(
        "DELETE FROM magic_links WHERE token_hash = @hash RETURNING user_id;",
      )
      const select = db.prepare("SELECT * FROM users WHERE id = @user_id;")

      const user_id = consume.get({ hash })
      const user = select.get({ user_id: Number(user_id?.user_id) })

      db.exec("COMMIT;")
      return { err: false, results: user as User }
    } catch (e: unknown) {
      db.exec("ROLLBACK")
      if (e instanceof Error) {
        return { err: e.message, results: undefined }
      } else {
        return { err: String(e), results: undefined }
      }
    }
  }

  function addSeizure(
    record: {
      substance: string
      amount: number
      seized_on: string
      reported_on: string
      user_id: number
    },
  ): {
    err: false | string
    results: StatementResultingChanges | undefined
  } {
    try {
      const results = db.prepare(
        "INSERT INTO seizures (substance, amount, seized_on, reported_on, user_id ) VALUES (@substance, @amount, @seized_on, @reported_on, @user_id) RETURNING *;",
      ).run(record)

      return { err: false, results }
    } catch (e: unknown) {
      if (e instanceof Error) {
        return { err: e.message, results: undefined }
      } else {
        return { err: String(e), results: undefined }
      }
    }
  }

  // TODO: need to deal with pagination.
  function getSeizures(): {
    err: false | string
    results: Record<string, SQLOutputValue>[] | undefined
  } {
    try {
      const results = db.prepare(
        "SELECT * FROM seizures;",
      ).all()
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
    user_id: number
  }

  function saveHash({ hash, user_id }: saveHashArguments) {
    try {
      return db.prepare(
        "INSERT INTO magic_links (user_id, token_hash) VALUES (@user_id, @hash);",
      ).run({ user_id, hash })
    } catch (e) {
      // TODO: do better here.
      console.error({ rollback: true, error: e })
      return undefined
    }
  }

  return {
    findOrCreateUser,
    consumeMagicLink,
    getSeizures,
    addSeizure,
    saveHash,
    deleteHash,
  }
}
