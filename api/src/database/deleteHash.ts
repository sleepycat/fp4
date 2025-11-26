import { DatabaseSync, StatementResultingChanges } from "node:sqlite"

export function deleteHash(
    db: DatabaseSync,
    hash: string,
): {
    err: false | string
    results: StatementResultingChanges | Record<string, never>
} {
    try {
        const results = db.prepare(
            "DELETE FROM magic_links WHERE token_hash = ?;",
        ).run(hash)
        return { err: false, results }
    } catch (e: unknown) {
        if (e instanceof Error) {
            return { err: e.message, results: {} }
        } else {
            return { err: String(e), results: {} }
        }
    }
}
