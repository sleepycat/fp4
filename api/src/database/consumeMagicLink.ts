import { DatabaseSync } from "node:sqlite"
import type { User } from "../types/User.ts"

export function consumeMagicLink(
    db: DatabaseSync,
    hash: string,
): {
    err: false | string
    results: User | undefined
} {
    db.exec("BEGIN TRANSACTION;")
    try {
        const consume = db.prepare(
            "DELETE FROM magic_links WHERE token_hash = @hash RETURNING user_id;",
        )
        const select = db.prepare("SELECT * FROM users WHERE id = @user_id;")

        const user_id = consume.get({ hash })
        // We keep hashes of the tokens we issue.
        // if we didn't find a matching hash, someone passed a token they just made up themselves.
        if (!user_id) throw new Error("invalid token")

        const user = select.get({ user_id: Number(user_id?.user_id) })

        db.exec("COMMIT;")
        return { err: false, results: user as User }
    } catch (e: unknown) {
        db.exec("ROLLBACK")
        if (e instanceof Error) {
            return { err: e.message, results: undefined }
        } else {
            return { err: String(e), results: undefined }
        }
    }
}
