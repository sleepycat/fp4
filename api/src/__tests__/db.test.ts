import { afterEach, beforeEach, describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { dataAccessors } from "../db.ts"
import migrate from "@gordonb/sqlite-migrate"
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
      expect.objectContaining({
        findOrCreateUser: expect.any(Function),
        consumeMagicLink: expect.any(Function),
        getSeizures: expect.any(Function),
        addSeizure: expect.any(Function),
        saveHash: expect.any(Function),
        deleteHash: expect.any(Function),
      }),
    )
  })
})
