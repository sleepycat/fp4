import { afterEach, beforeEach, describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { findOrCreateUser } from "../findOrCreateUser.ts"
import migrate from "@gordonb/sqlite-migrate"
import migrations from "../../../migrations.ts"
import { DatabaseSync } from "node:sqlite"

describe("findOrCreateUser()", () => {
  let db: DatabaseSync

  beforeEach(() => {
    // Creates a brand new, empty in-memory database for each test
    db = new DatabaseSync(":memory:")
    migrate(db, migrations)
  })

  afterEach(() => {
    if (db) {
      db.close()
    }
  })

  describe("given an empty users table", () => {
    it("creates a record and returns a user object", () => {
      const result = findOrCreateUser(db, "test@example.com")

      expect(result).toMatchObject(
        { email: "test@example.com" },
      )
    })
  })
})
