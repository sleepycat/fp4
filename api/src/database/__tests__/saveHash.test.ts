import { afterEach, beforeEach, describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { saveHash } from "../saveHash.ts"
import migrate from "@gordonb/sqlite-migrate"
import migrations from "../../../migrations.ts"
import { DatabaseSync } from "node:sqlite"
import type { User } from "../../types/User.ts"

describe("saveHash()", () => {
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

    describe("given a hash and a user id", () => {
        it("saves it to the magic_links table", () => {
            // create a user
            const user = db.prepare(
                "INSERT INTO users (email) VALUES (@email) RETURNING *;",
            ).get({
                email: "test@example.com",
            }) as User

            const response = saveHash(db, {
                hash:
                    "f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2",
                user_id: user.id,
            })
            expect(response).toEqual({
                changes: 1,
                lastInsertRowid: 1,
            })
        })
    })
})
