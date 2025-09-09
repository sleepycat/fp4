import { afterEach, beforeEach, describe, it } from "jsr:@std/testing/bdd"
import { expect } from "jsr:@std/expect"
import { dataAccessors } from "../db.ts"
import migrate from "jsr:@gordonb/sqlite-migrate"
import migrations from "../../migrations.ts"
import { DatabaseSync } from "node:sqlite"

describe("dataAccessors()", () => {
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

  it("returns a set of accessors that use the db", () => {
    const accessors = dataAccessors(db)

    expect(accessors).toEqual(
      expect.objectContaining({ findOrCreateUser: expect.any(Function) }),
    )
  })

  describe("saveHash()", () => {
    describe("given a hash and email", () => {
      it("saves it to the magic_links table", () => {
        // create the accessor functions
        const { saveHash } = dataAccessors(db)

        const response = saveHash({
          hash:
            "f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2",
          email: "test@example.com",
        })
        expect(response).toEqual({
          changes: 1,
          lastInsertRowid: 1,
        })
      })
    })
  })

  describe("deleteHash()", () => {
    describe("given an email", () => {
      it("deletes it from the magic_links table", () => {
        const hash =
          "f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2"
        // insert a test record
        db.prepare(
          "INSERT INTO magic_links (email, token_hash) VALUES (@email, @hash);",
        ).run(
          {
            hash,
            email: "test@example.com",
          },
        )

        // create the accessor functions
        const { deleteHash } = dataAccessors(db)

        const response = deleteHash(
          hash,
        )

        expect(response).toEqual({
          err: false,
          results: {
            changes: 1,
            lastInsertRowid: 1,
          },
        })
      })
    })
  })

  describe("consumeMagicLink()", () => {
    describe("given a hash", () => {
      it("retrieves the user from the magic_links table", () => {
        const hash =
          "f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2"

        // insert a test record
        db.prepare(
          "INSERT INTO magic_links (email, token_hash) VALUES (@email, @hash);",
        ).run(
          {
            hash,
            email: "test@example.com",
          },
        )

        // create the accessor functions
        const { consumeMagicLink } = dataAccessors(db)

        const response = consumeMagicLink(
          hash,
        )
        expect(response).toEqual({
          err: false,
          results: { email: "test@example.com" },
        })
      })

      it("deletes the record from the magic_links table", () => {
        const hash =
          "f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2"

        // insert a test record
        db.prepare(
          "INSERT INTO magic_links (email, token_hash) VALUES (@email, @hash);",
        ).run({ hash, email: "test@example.com" })

        // We're expecting a 1 record to exist before calling consumeMagicLink
        expect(
          db.prepare(
            "SELECT * FROM magic_links",
          ).all(),
        ).toEqual([{ email: "test@example.com", id: 1, token_hash: hash }])

        // create the accessor functions and call the consumeMagicLink function
        dataAccessors(db).consumeMagicLink(hash)

        // Run the query again and no records should exist:
        expect(
          db.prepare(
            "SELECT * FROM magic_links",
          ).all(),
        ).toEqual([])
      })
    })
  })

  describe("findOrCreateUser()", () => {
    describe("given an empty users table", () => {
      it("creates a user", () => {
        // create the accessor functions
        const { findOrCreateUser } = dataAccessors(db)

        const user = findOrCreateUser("test@example.com")

        expect(user).toEqual(expect.objectContaining({
          id: 1,
          email: "test@example.com",
        }))
      })
    })

    describe("given a users table with an existing user", () => {
      it("returns the user", () => {
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
      })

      it("does not create additional records", () => {
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
      })
    })
  })
})
