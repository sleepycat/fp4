import { afterEach, beforeEach, describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { getSeizureSummary } from "../getSeizureSummary.ts"
import migrate from "@gordonb/sqlite-migrate"
import migrations from "../../../migrations.ts"
import { DatabaseSync } from "node:sqlite"

describe("getSeizureSummary()", () => {
  let db: DatabaseSync

  beforeEach(() => {
    // Creates a brand new, empty in-memory database for each test
    db = new DatabaseSync(":memory:")
    // set up the schema
    migrate(db, migrations)
  })

  afterEach(() => {
    if (db) {
      db.close()
    }
  })

  it("returns a summary grouped by substance and month", () => {
    // create a user
    const user = db.prepare(
      "INSERT INTO users (email) VALUES (@email) RETURNING *;",
    ).get({
      email: "test@example.com",
    })
    const insert = db.prepare(
      "INSERT INTO seizures (substance, amount, reported_on, seized_on, user_id) values (@substance, @amount, @reported_on, @seized_on, @user_id); ",
    )
    ;[
      {
        substance: "cocaine",
        amount: 1.0,
        seized_on: "2025-01-01",
        reported_on: "2025-01-01",
        user_id: user!.id,
      },
      {
        substance: "cocaine",
        amount: 1.0,
        seized_on: "2025-01-01",
        reported_on: "2025-01-01",
        user_id: user!.id,
      },
      {
        substance: "heroin",
        amount: 1.0,
        seized_on: "2025-01-01",
        reported_on: "2025-01-01",
        user_id: user!.id,
      },
      {
        substance: "cocaine",
        amount: 1.0,
        seized_on: "2025-02-01",
        reported_on: "2025-02-01",
        user_id: user!.id,
      },
      {
        substance: "fentanyl",
        amount: 3.0,
        seized_on: "2025-02-01",
        reported_on: "2025-02-01",
        user_id: user!.id,
      },
    ].forEach((record) => insert.run(record))

    const response = getSeizureSummary(db)
    expect(response).toEqual([
      {
        month: "01-2025",
        substance: "cocaine",
        total: 2,
      },
      {
        month: "01-2025",
        substance: "heroin",
        total: 1,
      },
      {
        month: "02-2025",
        substance: "cocaine",
        total: 1,
      },
      {
        month: "02-2025",
        substance: "fentanyl",
        total: 3,
      },
    ])
  })
})
