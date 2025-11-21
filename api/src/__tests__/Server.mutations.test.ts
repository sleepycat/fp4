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

        const yoga = Server({
          schema,
          context: () => {
            // pass in the collaborator objects
            return {
              sendMagicLink,
              remoteAddress: "127.0.0.1",
              isAllowed: () => true, // pretend test@example.com is allowed
              rateLimiter: {
                login: { consume: fn() },
              },
              db,
            } as unknown as Context
          },
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
    describe("when the users email is permitted by isAllowed", () => {
      describe("when the rate limiter rejects the request", () => {
        it("returns an error", async () => {
          const yoga = Server({
            schema,
            context: () => {
              return {
                sendMagicLink: fn(),
                isAllowed: () => true, // pretend test@example.com is allowed
                remoteAddress: "127.0.0.1",
                rateLimiter: {
                  login: {
                    // Mock object mimicing the API of RateLimiterMemory from rate-limiter-flexible:
                    // https://github.com/animir/node-rate-limiter-flexible?tab=readme-ov-file#basic-example
                    consume: fn(
                      // indicating rate limit exceeded.
                      () => Promise.reject("nope"),
                    ),
                  },
                },
                db,
              } as unknown as Context
            },
          })

          // This should get blocked:
          const second = await yoga.fetch("http://yoga/graphql", {
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

          const seconddata = await second.json()

          expect(seconddata.errors).toBeDefined()
          expect(seconddata.errors[0]).toMatchObject({
            message: expect.stringContaining("Rate limit"),
          })
        })
      })
    })
  })

  describe("mutations.login", () => {
    describe("when the users email domain not allowed", () => {
      it("returns a deliberately ambiguous message to prevent account enumeration", async () => {
        // Arrange
        const yoga = Server({
          schema,
          context: () => {
            // pass in the collaborator objects
            return {
              sendMagicLink: fn(),
              isAllowed: () => false, //❌ nope!
              remoteAddress: "127.0.0.1",
              rateLimiter: {
                login: {
                  // Mock object mimicing the API of RateLimiterMemory from rate-limiter-flexible:
                  // https://github.com/animir/node-rate-limiter-flexible?tab=readme-ov-file#basic-example
                  consume: fn(
                    // first call to consume returns something truthy
                    () => true,
                    // second call to consume throws indicating rate limit exceeded.
                    () => {
                      throw new Error("nope")
                    },
                  ),
                },
              },
              db,
            } as unknown as Context
          },
        })

        // Act
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

        // Assert
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

        // make our graphql server
        const yoga = Server({
          schema,
          context: () => {
            // Add collaborator objects to the context
            return {
              jwt: useEncryptedJWT({
                base64secret: key,
                enforce: { issuer: "https://example.com", audience: "fp4" },
              }),
              db,
            } as unknown as Context
          },
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
        const yoga = Server({
          schema,
          context: () => {
            // Add collaborator objects to the context
            return {
              jwt: useEncryptedJWT({
                base64secret: key,
                enforce: { issuer: "https://example.com", audience: "fp4" },
              }),
              db,
            } as unknown as Context
          },
        })

        // Act
        // If we generate our own ulid, will the API set an auth cookie?
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

        // No auth cookie header should be set
        expect(response.headers.getSetCookie()).not.toMatch(
          /__Host-fp4auth=\w+/,
        )
        // We should get an error about our self-issued token:
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
