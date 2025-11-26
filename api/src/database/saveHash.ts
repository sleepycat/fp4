import { DatabaseSync } from "node:sqlite"

interface saveHashArguments {
    hash: string
    user_id: number
}

export function saveHash(
    db: DatabaseSync,
    { hash, user_id }: saveHashArguments,
) {
    try {
        return db.prepare(
            "INSERT INTO magic_links (user_id, token_hash) VALUES (@user_id, @hash);",
        ).run({ user_id, hash })
    } catch (e) {
        // TODO: do better here.
        console.error({ rollback: true, error: e })
        return undefined
    }
}
