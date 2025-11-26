import { afterEach, beforeEach, describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { addSeizure } from "../addSeizure.ts"
import migrate from "@gordonb/sqlite-migrate"
import migrations from "../../../migrations.ts"
import { DatabaseSync } from "node:sqlite"

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

    it("saves seizure details to the seizurestable", () => {
        // create a user
        db.prepare("INSERT INTO users (email ) VALUES (@email);").run({
            email: "test@example.com",
        })
        // create a seizure record associated to that user.

        // Does it return the seizure record?
        const response = addSeizure(
            db,
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
