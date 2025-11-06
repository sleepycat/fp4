import { afterEach, beforeEach, describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import migrate from "@gordonb/sqlite-migrate"
import migrations from "../../migrations.ts"
import { DatabaseSync } from "node:sqlite"
import { paginateBackwards, paginateForward } from "../pagination.ts"

describe("Pagination", () => {
  let db: DatabaseSync

  beforeEach(() => {
    // Creates a brand new, empty in-memory database for each test
    db = new DatabaseSync(":memory:")
    migrate(db, migrations)
    // create a user
    db.prepare("INSERT INTO users (email) VALUES (@email);").run({
      email: "test@example.com",
    })
    // create seizure records associated to that user.
    const insert = db.prepare(
      "INSERT INTO seizures (substance, amount, seized_on, reported_on, user_id ) VALUES (@substance, @amount, @seized_on, @reported_on, @user_id);",
    )
    ;[
      {
        substance: "first",
        amount: 1,
        seized_on: "2025-01-01",
        reported_on: "2025-01-01",
        user_id: 1,
      },
      {
        substance: "second",
        amount: 2,
        seized_on: "2025-02-02",
        reported_on: "2025-02-02",
        user_id: 1,
      },
      {
        substance: "third",
        amount: 3,
        seized_on: "2025-03-03",
        reported_on: "2025-03-03",
        user_id: 1,
      },
      {
        substance: "fourth",
        amount: 4,
        seized_on: "2025-04-04",
        reported_on: "2025-04-04",
        user_id: 1,
      },
    ].forEach((record) => insert.run(record))
  })

  afterEach(() => {
    if (db) {
      db.close()
    }
  })

  describe("paginateBackwards()", () => {
    it("getting 1 record before #2 retrieves #1", () => {
      const response = paginateBackwards({
        db,
        last: 1,
        before: 2,
        table: "seizures",
      })

      expect(response).toEqual({
        err: false,
        results: [
          {
            id: 1,
            substance: "first",
            amount: 1,
            seized_on: "2025-01-01",
            reported_on: "2025-01-01",
            user_id: 1,
          },
        ],
      })
    })

    it("getting 2 records before #4 retrieves #2 & #3", () => {
      const response = paginateBackwards({
        db,
        last: 2,
        before: 4,
        table: "seizures",
      })

      expect(response).toEqual({
        err: false,
        results: [
          {
            id: 2,
            substance: "second",
            amount: 2,
            seized_on: "2025-02-02",
            reported_on: "2025-02-02",
            user_id: 1,
          },
          {
            id: 3,
            substance: "third",
            amount: 3,
            seized_on: "2025-03-03",
            reported_on: "2025-03-03",
            user_id: 1,
          },
        ],
      })
    })
  })

  describe("paginateForward()", () => {
    it("getting 1 record after #1 retrieves #2", () => {
      const response = paginateForward({
        db,
        first: 1,
        after: 1,
        table: "seizures",
      })

      expect(response).toEqual({
        err: false,
        results: [
          {
            id: 2,
            substance: "second",
            amount: 2,
            seized_on: "2025-02-02",
            reported_on: "2025-02-02",
            user_id: 1,
          },
        ],
      })
    })

    it("getting 2 records after #1 retrieves #2 and #3", () => {
      const response = paginateForward({
        db,
        first: 2,
        after: 1,
        table: "seizures",
      })

      expect(response).toEqual({
        err: false,
        results: [
          {
            id: 2,
            substance: "second",
            amount: 2,
            seized_on: "2025-02-02",
            reported_on: "2025-02-02",
            user_id: 1,
          },
          {
            id: 3,
            substance: "third",
            amount: 3,
            seized_on: "2025-03-03",
            reported_on: "2025-03-03",
            user_id: 1,
          },
        ],
      })
    })
  })
})
