import { afterEach, beforeEach, describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { getSeizures } from "../getSeizures.ts"
import migrate from "@gordonb/sqlite-migrate"
import migrations from "../../../migrations.ts"
import { DatabaseSync } from "node:sqlite"

describe("getSeizures()", () => {
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

        // Does it return the seizure record?
        const response = getSeizures(db)
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
