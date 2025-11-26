import { afterEach, beforeEach, describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { consumeMagicLink } from "../consumeMagicLink.ts"
import migrate from "@gordonb/sqlite-migrate"
import migrations from "../../../migrations.ts"
import { DatabaseSync } from "node:sqlite"
import type { User } from "../../types/User.ts"

describe("consumeMagicLink()", () => {
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

    describe("given a hash", () => {
        it("retrieves the user from the magic_links table", () => {
            const hash =
                "f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2"

            // create a user
            const user = db.prepare(
                "INSERT INTO users (email, created_at) VALUES (@email, @created_at) RETURNING *;",
            ).get({
                email: "test@example.com",
                created_at: "2025-09-17 18:52:27",
            }) as User

            // insert a test record
            db.prepare(
                "INSERT INTO magic_links (user_id, token_hash) VALUES (@user_id, @hash);",
            ).run(
                {
                    hash,
                    user_id: user.id,
                },
            )

            const response = consumeMagicLink(db, hash)
            expect(response).toEqual({
                err: false,
                results: {
                    created_at: "2025-09-17 18:52:27",
                    email: "test@example.com",
                    id: 1,
                },
            })
        })

        it("deletes the record from the magic_links table", () => {
            const hash =
                "f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2"

            // create a user
            const user = db.prepare(
                "INSERT INTO users (email) VALUES (@email) RETURNING *;",
            ).get({
                email: "test@example.com",
            }) as User

            // insert a test record
            db.prepare(
                "INSERT INTO magic_links (user_id, token_hash) VALUES (@user_id, @hash);",
            ).run({ hash, user_id: user.id })

            // We're expecting a 1 record to exist before calling consumeMagicLink
            expect(
                db.prepare(
                    "SELECT * FROM magic_links;",
                ).all(),
            ).toEqual([{ id: 1, user_id: 1, token_hash: hash }])

            // call the consumeMagicLink function
            consumeMagicLink(db, hash)

            // Run the query again and no records should exist:
            expect(
                db.prepare(
                    "SELECT * FROM magic_links",
                ).all(),
            ).toEqual([])
        })
    })

    describe("given a hash that doesn't match anything", () => {
        it("returns an error", () => {
            const hash =
                "f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2"

            const response = consumeMagicLink(db, hash)

            expect(response).toEqual({
                err: "invalid token",
                results: undefined,
            })
        })
    })
})
