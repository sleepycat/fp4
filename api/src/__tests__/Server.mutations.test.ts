import { afterEach, beforeEach, describe, it } from "@std/testing/bdd"
import { expect, fn } from "@std/expect"
import { schema } from "../schema.ts"
import type { Context } from "../types/Context.ts"
import { Server } from "../Server.ts"
import migrate from "@gordonb/sqlite-migrate"
import migrations from "../../migrations.ts"
import { dataAccessors } from "../db.ts"
import { DatabaseSync } from "node:sqlite"
import { sha256 } from "../sha256.ts"
import { monotonicUlid, ulid } from "@std/ulid"
import { generateSecret, useEncryptedJWT } from "../useEncryptedJWT.ts"

const key = await generateSecret()

describe("Server", () => {
  let db: ReturnType<typeof dataAccessors>
  let database: DatabaseSync

  beforeEach(() => {
    // Creates a brand new, empty in-memory database for each test
    database = new DatabaseSync(":memory:")
    migrate(database, migrations)
    db = dataAccessors(database)
  })

  afterEach(() => {
    if (db) {
      database.close()
    }
  })

  describe("mutations.login", () => {
    describe("when the users email is permitted by isAllowed", () => {
      it("calls the Notify API via the sendMagicLink function", async () => {
        // set up a spy object
        const sendMagicLink = fn(() => {})

        // pass in the collaborator objects
        const mockContext = {
          sendMagicLink,
          isAllowed: () => true, // pretend test@example.com is allowed
          rateLimiter: {
            login: { consume: fn() },
          },
          db,
        } as unknown as Context
        const yoga = Server({
          schema,
          context: () => mockContext,
        })

        await yoga.fetch("http://yoga/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              mutation ($email: EmailAddress!) {
                login(email: $email)
              }
            `,
            variables: { email: "test@example.com" },
          }),
        })

        expect(sendMagicLink).toHaveBeenCalled()
      })
    })
  })

  describe("mutations.login", () => {
    describe("when the users email domain not allowed", () => {
      it("returns a deliberately ambiguous message to prevent account enumeration", async () => {
        // pass in the collaborator objects
        const mockContext = {
          sendMagicLink: fn(),
          isAllowed: () => false, //❌ nope!
          rateLimiter: {
            login: { consume: fn() },
            verify: { consume: fn() },
          },
          db,
        } as unknown as Context

        const yoga = Server({
          schema,
          context: () => mockContext,
        })

        const response = await yoga.fetch("http://yoga/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              mutation ($email: EmailAddress!) {
                login(email: $email)
              }
            `,
            variables: { email: "test@example.com" },
          }),
        })

        const results = await response.json()

        expect(results).toEqual(expect.objectContaining({
          data: { login: expect.stringMatching(/If an account exists/) },
        }))
      })
    })
  })

  describe("mutations.verify", () => {
    describe("with a previously issued token in the database", () => {
      it("sets a cookie", async () => {
        // Arrange
        // create an initial user
        const user = database.prepare(
          "INSERT INTO users (email) VALUES (@email) RETURNING *;",
        ).get({ email: "test@example.com" })

        // We track the ulids we issued by inserting their hash in the database.
        // For this test we want to check what happens when someone presents a token we
        // *did* issue.
        const token = monotonicUlid()
        const hash = await sha256(token)
        database.prepare(
          "INSERT INTO magic_links (user_id, token_hash) VALUES (@user_id, @hash);",
        ).run({
          hash,
          user_id: user!.id,
        })

        // Add collaborator objects to the context
        const mockContext = {
          jwt: useEncryptedJWT({
            base64secret: key,
            enforce: { issuer: "https://example.com", audience: "fp4" },
          }),
          db,
        } as unknown as Context
        // make our graphql server
        const yoga = Server({
          schema,
          context: () => mockContext,
        })

        // Act
        // Query the api: we expect the response to set a auth cookie in the reponse
        const response = await yoga.fetch("http://yoga/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              mutation ($token: ULID!) {
                verify(token: $token)
              }
            `,
            variables: { token },
          }),
        })

        // Assert
        // expect an auth cookie to have been set
        expect(response.headers.getSetCookie()).toMatch(
          /__Host-fp4auth=\w+/,
        )
      })
    })

    describe("with no previously issued tokens", () => {
      it("returns an error", async () => {
        // Arrange

        // Add collaborator objects to the context
        const mockContext = {
          jwt: useEncryptedJWT({
            base64secret: key,
            enforce: { issuer: "https://example.com", audience: "fp4" },
          }),
          db,
        } as unknown as Context
        // make our graphql server
        const yoga = Server({
          schema,
          context: () => mockContext,
        })

        // Act
        // Query the api: we expect the response to set a auth cookie in the reponse
        const response = await yoga.fetch("http://yoga/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              mutation ($token: ULID!) {
                verify(token: $token)
              }
            `,
            variables: { token: ulid() }, // Generate one and try!
          }),
        })

        const results = await response.json()

        // Assert
        // expect an auth cookie to have been set
        expect(results).toMatchObject({
          data: { verify: null },
          errors: [
            expect.objectContaining({
              message: expect.stringContaining("Invalid token."),
            }),
          ],
        })
      })
    })
  })
})
