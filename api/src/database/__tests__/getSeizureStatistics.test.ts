import { describe, it, beforeEach, afterEach } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { DatabaseSync } from "node:sqlite"
import { getSeizureStatistics } from "../getSeizureStatistics.ts"
import migrate from "@gordonb/sqlite-migrate"
import migrations from "../../../migrations.ts"

describe("getSeizureStatistics", () => {
    let db: DatabaseSync
    let userId: number

    beforeEach(() => {
        db = new DatabaseSync(":memory:")
        db.exec("PRAGMA foreign_keys = ON;")
        migrate(db, migrations)

        // Create a dummy user
        const stmt = db.prepare("INSERT INTO users (email) VALUES (?) RETURNING id")
        const result = stmt.get("test@example.com") as { id: number }
        userId = result.id
    })

    afterEach(() => {
        db.close()
    })

    it("returns statistics as a flat list", () => {
        // Insert some seizures
        const insertSeizure = db.prepare(`
      INSERT INTO seizures (reference, location, seized_on, user_id)
      VALUES (?, ?, ?, ?)
      RETURNING id
    `)

        const insertSubstance = db.prepare(`
        INSERT INTO substances (name, category, amount, unit, seizure_id)
        VALUES (?, ?, ?, ?, ?)
    `)

        const testData = [
            { date: "2023-01-15", name: "Cannabis", amount: 10 },
            { date: "2023-01-20", name: "Psilocybin", amount: 5 },
            { date: "2023-02-10", name: "Cannabis", amount: 15 },
            { date: "2023-02-28", name: "Cannabis", amount: 20 },
        ]

        testData.forEach((data, index) => {
            const s = insertSeizure.get(`Ref${index}`, "Loc1", data.date, userId) as {
                id: number
            }
            insertSubstance.run(
                data.name,
                "CONTROLLED_SUBSTANCES",
                data.amount,
                "GRAMS",
                s.id,
            )
        })

        const stats = getSeizureStatistics(db, 2023)

        // Sort to ensure deterministic order for comparison
        stats.sort(
            (a, b) => a.month - b.month || a.drugType.localeCompare(b.drugType),
        )

        expect(stats).toEqual([
            {
                id: "2023-1-Cannabis",
                month: 1,
                drugType: "Cannabis",
                amount: 10,
            },
            {
                id: "2023-1-Psilocybin",
                month: 1,
                drugType: "Psilocybin",
                amount: 5,
            },
            {
                id: "2023-2-Cannabis",
                month: 2,
                drugType: "Cannabis",
                amount: 35,
            },
        ])
    })
})
