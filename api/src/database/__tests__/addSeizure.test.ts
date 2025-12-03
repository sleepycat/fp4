import { afterEach, beforeEach, describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { addSeizure } from "../addSeizure.ts"
import migrate from "@gordonb/sqlite-migrate"
import migrations from "../../../migrations.ts"
import { DatabaseSync } from "node:sqlite"
import type { User } from "../../types/User.ts"

describe("addSeizure()", () => {
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

  it("saves seizure details to the seizures table", () => {
    // create a user
    const user = db.prepare(
      "INSERT INTO users (email ) VALUES (@email) RETURNING *;",
    ).get({
      email: "test@example.com",
    }) as User

    // create a seizure record associated to that user.
    addSeizure(
      db,
      {
        reference: "#12345",
        location: "123 Main St.",
        seizedOn: "2025-09-16",
        reportedOn: "2025-09-16",
        substances: [{
          name: "iocaine powder",
          category: "controlled substance",
          unit: "grams",
          amount: 3,
        }, {
          name: "phlogiston",
          category: "chemical property",
          unit: "grams",
          amount: 7,
        }],

        userId: user!.id,
      },
    )

    // expect that this was properly inserted into both tables
    const seizures = db.prepare(`
      SELECT substances.name,
        seizures.reference
      FROM substances right JOIN seizures
      ON substances.seizure_id = seizures.id;
    `).all()

    expect(seizures).toEqual([{ name: "iocaine powder", reference: "#12345" }, {
      name: "phlogiston",
      reference: "#12345",
    }])
  })

  it("returns an object with seizure details", () => {
    // create a user
    const user = db.prepare(
      "INSERT INTO users (email) VALUES (@email) RETURNING *;",
    ).get({
      email: "test@example.com",
    }) as User

    // create a seizure record associated to that user.
    const response = addSeizure(
      db,
      {
        reference: "#12345",
        location: "123 Main St.",
        seizedOn: "2025-09-16",
        reportedOn: "2025-09-16",
        substances: [{
          name: "iocaine powder",
          category: "controlled substance",
          unit: "grams",
          amount: 3,
        }, {
          name: "phlogiston",
          category: "chemical property",
          unit: "grams",
          amount: 7,
        }],
        userId: user!.id,
      },
    )

    expect(response).toEqual(
      {
        err: false,
        results: {
          id: 1,
          location: "123 Main St.",
          reference: "#12345",
          reported_on: "2025-09-16",
          seized_on: "2025-09-16",
          substances: [
            {
              id: 1,
              name: "iocaine powder",
              amount: 3,
              category: "controlled substance",
              seizure_id: 1,
              unit: "grams",
            },
            {
              id: 2,
              name: "phlogiston",
              amount: 7,
              category: "chemical property",
              seizure_id: 1,
              unit: "grams",
            },
          ],
          user_id: 1,
        },
      },
    )
  })
})
