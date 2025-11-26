import { afterEach, beforeEach, describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { deleteHash } from "../deleteHash.ts"
import migrate from "@gordonb/sqlite-migrate"
import migrations from "../../../migrations.ts"
import { DatabaseSync } from "node:sqlite"
import type { User } from "../../types/User.ts"

describe("deleteHash()", () => {
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
        it("deletes it from the magic_links table", () => {
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
            ).run(
                {
                    hash,
                    user_id: user.id,
                },
            )

            const response = deleteHash(
                db,
                hash,
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
})
