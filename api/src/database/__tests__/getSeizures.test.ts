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

        // create a user
        db.prepare("INSERT INTO users (email ) VALUES (@email);").run({
            email: "test@example.com",
        })

        // create seizure records
        const insertSeizure = db.prepare(
            "INSERT INTO seizures (reference, location, seized_on, reported_on, user_id ) VALUES (@reference, @location, @seized_on, @reported_on, @user_id);",
        )
        const insertSubstance = db.prepare(
            "INSERT INTO substances (name, category, amount, unit, seizure_id) VALUES (@name, @category, @amount, @unit, @seizure_id);",
        )

            ;[
                {
                    reference: "REF-001",
                    location: "Location 1",
                    seized_on: "2025-01-01",
                    reported_on: "2025-01-01",
                    user_id: 1,
                    substance: "first",
                    amount: 1,
                },
                {
                    reference: "REF-002",
                    location: "Location 2",
                    seized_on: "2025-02-02",
                    reported_on: "2025-02-02",
                    user_id: 1,
                    substance: "second",
                    amount: 2,
                },
                {
                    reference: "REF-003",
                    location: "Location 3",
                    seized_on: "2025-03-03",
                    reported_on: "2025-03-03",
                    user_id: 1,
                    substance: "third",
                    amount: 3,
                },
            ].forEach((record, index) => {
                insertSeizure.run({
                    reference: record.reference,
                    location: record.location,
                    seized_on: record.seized_on,
                    reported_on: record.reported_on,
                    user_id: record.user_id,
                })
                insertSubstance.run({
                    name: record.substance,
                    category: "controlled",
                    amount: record.amount,
                    unit: "grams",
                    seizure_id: index + 1, // Assuming auto-increment starts at 1 and matches loop order
                })
            })
    })

    afterEach(() => {
        if (db) {
            db.close()
        }
    })

    it("retrieves all records by default (limit 50)", () => {
        const response = getSeizures(db)
        expect(response.err).toBe(false)
        expect(response.results).toHaveLength(3)
        expect(response.results![0].substance).toBe("first")
        expect(response.hasMore).toBe(false)
    })

    it("supports forward pagination (first/after)", () => {
        const response = getSeizures(db, { first: 1, after: 1 })
        expect(response.err).toBe(false)
        expect(response.results).toHaveLength(1)
        expect(response.results![0].substance).toBe("second")
        expect(response.hasMore).toBe(true)
    })

    it("supports backward pagination (last/before)", () => {
        const response = getSeizures(db, { last: 1, before: 3 })
        expect(response.err).toBe(false)
        expect(response.results).toHaveLength(1)
        expect(response.results![0].substance).toBe("second")
        expect(response.hasMore).toBe(true)
    })

    it("correctly sets hasMore when no more records", () => {
        const response = getSeizures(db, { first: 5 })
        expect(response.hasMore).toBe(false)
    })
})
