import { afterEach, beforeEach, describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import migrate from "@gordonb/sqlite-migrate"
import migrations from "../../migrations.ts"
import { DatabaseSync } from "node:sqlite"
import { dataAccessors } from "../db.ts"

describe("db.getSeizures() pagination", () => {
    let db: DatabaseSync
    let accessors: ReturnType<typeof dataAccessors>

    beforeEach(() => {
        db = new DatabaseSync(":memory:")
        migrate(db, migrations)
        accessors = dataAccessors(db)

        // create a user
        db.prepare("INSERT INTO users (email) VALUES (@email);").run({
            email: "test@example.com",
        })

        // create seizure records
        const insert = db.prepare(
            "INSERT INTO seizures (substance, amount, seized_on, reported_on, user_id ) VALUES (@substance, @amount, @seized_on, @reported_on, @user_id);",
        )
            ;[
                { substance: "first", amount: 1, seized_on: "2025-01-01", reported_on: "2025-01-01", user_id: 1 },
                { substance: "second", amount: 2, seized_on: "2025-02-02", reported_on: "2025-02-02", user_id: 1 },
                { substance: "third", amount: 3, seized_on: "2025-03-03", reported_on: "2025-03-03", user_id: 1 },
            ].forEach((record) => insert.run(record))
    })

    afterEach(() => {
        if (db) {
            db.close()
        }
    })

    it("returns all records by default (limit 50)", () => {
        const response = accessors.getSeizures()
        expect(response.err).toBe(false)
        expect(response.results).toHaveLength(3)
        expect(response.results![0].substance).toBe("first")
        expect(response.hasMore).toBe(false)
    })

    it("supports forward pagination (first/after)", () => {
        const response = accessors.getSeizures({ first: 1, after: 1 })
        expect(response.err).toBe(false)
        expect(response.results).toHaveLength(1)
        expect(response.results![0].substance).toBe("second")
        expect(response.hasMore).toBe(true)
    })

    it("supports backward pagination (last/before)", () => {
        const response = accessors.getSeizures({ last: 1, before: 3 })
        expect(response.err).toBe(false)
        expect(response.results).toHaveLength(1)
        expect(response.results![0].substance).toBe("second")
        expect(response.hasMore).toBe(true)
    })

    it("correctly sets hasMore when no more records", () => {
        const response = accessors.getSeizures({ first: 5 })
        expect(response.hasMore).toBe(false)
    })
})
