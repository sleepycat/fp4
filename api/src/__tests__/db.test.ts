import { afterEach, beforeEach, describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { dataAccessors } from "../db.ts"
import migrate from "@gordonb/sqlite-migrate"
import migrations from "../../migrations.ts"
import { DatabaseSync } from "node:sqlite"
import type { User } from "../types/User.ts"

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
    describe("given a hash and a user id", () => {
      it("saves it to the magic_links table", () => {
        // create a user
        const user = db.prepare(
          "INSERT INTO users (email) VALUES (@email) RETURNING *;",
        ).get({
          email: "test@example.com",
        }) as User

        // create the accessor functions
        const { saveHash } = dataAccessors(db)

        const response = saveHash({
          hash:
            "f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2",
          user_id: user.id,
        })
        expect(response).toEqual({
          changes: 1,
          lastInsertRowid: 1,
        })
      })
    })
  })

  describe("getSeizures()", () => {
    it("retrieves seizure details from the seizures table", () => {
      // create a user
      db.prepare("INSERT INTO users (email ) VALUES (@email);").run({
        email: "test@example.com",
      })
      // create a seizure record associated to that user.
      db.prepare(
        "INSERT INTO seizures (substance, amount, seized_on, reported_on, user_id ) VALUES (@substance, @amount, @seized_on, @reported_on, @user_id);",
      ).run(
        {
          substance: "iocaine powder",
          amount: 100,
          seized_on: "2025-09-16",
          reported_on: "2025-09-16",
          user_id: 1,
        },
      )

      // create the accessor functions
      const { getSeizures } = dataAccessors(db)

      // Does it return the seizure record?
      const response = getSeizures()
      expect(response).toEqual({
        err: false,
        results: [
          {
            amount: 100,
            id: 1,
            reported_on: "2025-09-16",
            seized_on: "2025-09-16",
            substance: "iocaine powder",
            user_id: 1,
          },
        ],
        hasMore: false,
      })
    })
  })

  describe("addSeizure()", () => {
    it("saves seizure details to the seizurestable", () => {
      // create a user
      db.prepare("INSERT INTO users (email ) VALUES (@email);").run({
        email: "test@example.com",
      })
      // create a seizure record associated to that user.

      // create the accessor functions
      const { addSeizure } = dataAccessors(db)

      // Does it return the seizure record?
      const response = addSeizure(
        {
          substance: "iocaine powder",
          amount: 100,
          seized_on: "2025-09-16",
          reported_on: "2025-09-16",
          user_id: 1,
        },
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

  // deleteHash is used for expire tokens. It's not returning a user.
  describe("deleteHash()", () => {
    describe("given a hash", () => {
      it("deletes it from the magic_links table", () => {
        const hash =
          "f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2"

        // create a user
        const user = db.prepare(
          "INSERT INTO users (email) VALUES (@email) RETURNING *;",
        ).get({
          email: "test@example.com",
        }) as User

        // insert a test record
        db.prepare(
          "INSERT INTO magic_links (user_id, token_hash) VALUES (@user_id, @hash);",
        ).run(
          {
            hash,
            user_id: user.id,
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

        // create a user
        const user = db.prepare(
          "INSERT INTO users (email, created_at) VALUES (@email, @created_at) RETURNING *;",
        ).get({
          email: "test@example.com",
          created_at: "2025-09-17 18:52:27",
        }) as User

        // insert a test record
        db.prepare(
          "INSERT INTO magic_links (user_id, token_hash) VALUES (@user_id, @hash);",
        ).run(
          {
            hash,
            user_id: user.id,
          },
        )

        // create the accessor functions
        const { consumeMagicLink } = dataAccessors(db)

        const response = consumeMagicLink(
          hash,
        )
        expect(response).toEqual({
          err: false,
          results: {
            created_at: "2025-09-17 18:52:27",
            email: "test@example.com",
            id: 1,
          },
        })
      })

      it("deletes the record from the magic_links table", () => {
        const hash =
          "f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2"

        // create a user
        const user = db.prepare(
          "INSERT INTO users (email) VALUES (@email) RETURNING *;",
        ).get({
          email: "test@example.com",
        }) as User

        // insert a test record
        db.prepare(
          "INSERT INTO magic_links (user_id, token_hash) VALUES (@user_id, @hash);",
        ).run({ hash, user_id: user.id })

        // We're expecting a 1 record to exist before calling consumeMagicLink
        expect(
          db.prepare(
            "SELECT * FROM magic_links;",
          ).all(),
        ).toEqual([{ id: 1, user_id: 1, token_hash: hash }])

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

    describe("given a hash that doesn't match anything", () => {
      it("returns an error", () => {
        const hash =
          "f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2"

        // create the accessor functions
        const { consumeMagicLink } = dataAccessors(db)

        const response = consumeMagicLink(
          hash,
        )

        expect(response).toEqual({
          err: "invalid token",
          results: undefined,
        })
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
        // look for side effects: there should be one user.
        const records = db.prepare("SELECT COUNT(id) as count FROM users").get()

        expect(records?.count).toEqual(1)
      })
    })
  })
})
