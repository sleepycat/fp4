import { DatabaseSync, StatementResultingChanges } from "node:sqlite"

export function addSeizure(
    db: DatabaseSync,
    record: {
        substance: string
        amount: number
        seized_on: string
        reported_on: string
        user_id: number
    },
): {
    err: false | string
    results: StatementResultingChanges | undefined
} {
    try {
        const results = db.prepare(
            "INSERT INTO seizures (substance, amount, seized_on, reported_on, user_id ) VALUES (@substance, @amount, @seized_on, @reported_on, @user_id) RETURNING *;",
        ).run(record)

        return { err: false, results }
    } catch (e: unknown) {
        if (e instanceof Error) {
            return { err: e.message, results: undefined }
        } else {
            return { err: String(e), results: undefined }
        }
    }
}
