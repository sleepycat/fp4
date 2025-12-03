import { afterEach, beforeEach, describe, it } from "@std/testing/bdd"
import { expect, fn } from "@std/expect"
import { schema } from "../schema.ts"
import type { Context } from "../types/Context.ts"
import { Server } from "../Server.ts"
import migrate from "@gordonb/sqlite-migrate"
import migrations from "../../migrations.ts"
import { dataAccessors } from "../db.ts"
import { DatabaseSync } from "node:sqlite"
import { generateSecret, useEncryptedJWT } from "../useEncryptedJWT.ts"
import { reportDrugSeizure } from "../resolvers/reportDrugSeizure.ts"

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

  describe("mutations.reportDrugSeizure", () => {
    describe("with an authenticatedUser", () => {
      it("saves a SeizureRecord", async () => {
        // Arrange
        // create an initial user in the database
        const user = database.prepare(
          "INSERT INTO users (email) VALUES (@email) RETURNING *;",
        ).get({ email: "test@example.com" })

        const yoga = Server({
          schema,
          context: () => {
            // pass in the collaborator objects
            return {
              authenticatedUser: user,
              remoteAddress: "127.0.0.1",
              isAllowed: () => true, // pretend test@example.com is allowed
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
              mutation SEIZURE($input: SeizureInput!) {
                reportDrugSeizure(
                  input: $input
                )
              }
            `,
            variables: {
              "input": {
                "location": "1234 Main St",
                "reference": "#1234",
                "seizedOn": "2025-11-03",
                "substances": [
                  {
                    "amount": 3,
                    "category": "CONTROLLED_SUBSTANCES",
                    "name": "iocaine powder",
                    "unit": "GRAMS",
                  },
                ],
              },
            },
          }),
        })

        const result = await response.json()

        // Assert
        expect(result).toEqual({ data: { reportDrugSeizure: "👍" } })
      })
    })
  })

  describe("mutations.reportDrugSeizure", () => {
    describe("without an authenticatedUser", () => {
      it("returns an error", async () => {
        // Arrange

        const yoga = Server({
          schema,
          context: () => {
            return {
              // authenticatedUser: user, <- nope!
              remoteAddress: "127.0.0.1",
              isAllowed: () => true, // pretend test@example.com is allowed
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
              mutation SEIZURE($input: SeizureInput!) {
                reportDrugSeizure(
                  input: $input
                )
              }
            `,
            variables: {
              "input": {
                "location": "1234 Main St",
                "reference": "#1234",
                "seizedOn": "2025-11-03",
                "substances": [
                  {
                    "amount": 3,
                    "category": "CONTROLLED_SUBSTANCES",
                    "name": "iocaine powder",
                    "unit": "GRAMS",
                  },
                ],
              },
            },
          }),
        })

        const result = await response.json()

        // Assert
        expect(result).toMatchObject({
          errors: [
            {
              message: expect.stringContaining(
                "Authentication required to access this resource.",
              ),
              extensions: { code: "UNAUTHENTICATED" },
            },
          ],
        })
      })
    })
  })
})
