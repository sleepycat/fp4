import { describe, it } from "jsr:@std/testing/bdd"
import { expect } from "jsr:@std/expect"
import { dataAccessors } from "./db.ts"
import migrate from "@gordonb/sqlite-migrate"
import migrations from "../migrations.ts"
import { DatabaseSync } from "node:sqlite"

describe("dataAccessors()", () => {
  it("returns a set of accessors that use the db", () => {
    const db = new DatabaseSync(":memory:")
    migrate(db, migrations)
    const accessors = dataAccessors(db)

    expect(accessors).toEqual(
      expect.objectContaining({ findOrCreateUser: expect.any(Function) }),
    )
    db.close()
  })

  describe("findOrCreateUser()", () => {
    describe("given an empty users table", () => {
      it("creates a user", () => {
        const db = new DatabaseSync(":memory:")
        // create the tables:
        migrate(db, migrations)

        // create the accessor functions
        const { findOrCreateUser } = dataAccessors(db)

        const user = findOrCreateUser("test@example.com")

        expect(user).toEqual(expect.objectContaining({
          id: 1,
          email: "test@example.com",
        }))
        db.close()
      })
    })

    describe("given a users table with an existing user", () => {
      it("returns the user", () => {
        const db = new DatabaseSync(":memory:")
        // create the tables:
        migrate(db, migrations)
        // create an initial user
        db.exec(
          "INSERT INTO users (email, created_at) VALUES ('test@example.com', DATE('now'))",
        )

        // create the accessor functions
        const { findOrCreateUser } = dataAccessors(db)

        const user = findOrCreateUser("test@example.com")

        expect(user).toEqual(expect.objectContaining({
          id: 1,
          email: "test@example.com",
        }))

        db.close()
      })

      it("does not create additional records", () => {
        const db = new DatabaseSync(":memory:")
        // create the tables:
        migrate(db, migrations)
        // create an initial user
        db.exec(
          "INSERT INTO users (email, created_at) VALUES ('test@example.com', DATE('now'))",
        )

        // create the accessor functions
        const { findOrCreateUser } = dataAccessors(db)

        // we don't care about the result here, just the side effects
        findOrCreateUser("test@example.com")
        // look for side effects: there should only be one user.
        const records = db.prepare("SELECT COUNT(id) as count FROM users").get()

        expect(records?.count).toEqual(1)
        db.close()
      })
    })
  })
})
