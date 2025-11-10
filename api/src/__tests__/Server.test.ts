import { describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { schema } from "../schema.ts"
import type { Context } from "../types/Context.ts"
import { Server } from "../Server.ts"

describe("Server", () => {
  describe("query.seizures", () => {
    describe("given an authenticated user in context", () => {
      const mockContext = {
        authenticatedUser: { user_id: 1, email: "test@example.com" },
        db: {
          getSeizures: () => ({
            err: false,
            results: [{
              id: 1,
              substance: "playdough",
              reportedOn: "2025-11-10",
              seizedOn: "2025-11-10",
              amount: 1.1,
              user_id: 1,
            }],
          }),
        },
      } as unknown as Context

      it("returns a list of seizures", async () => {
        const yoga = Server({
          schema,
          context: () => mockContext,
        })

        const response = await yoga.fetch("http://yoga/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              {
                seizures {
                  substance
                }
              }
            `,
          }),
        })

        const result = await response.json()

        expect(result).toEqual({
          data: { seizures: [{ substance: "playdough" }] },
        })
      })
    })
  })

  describe("query.seizures", () => {
    describe("without an authenticated user", () => {
      const mockContext = {
        // no authenticatedUser object
        db: {
          getSeizures: () => ({
            err: false,
            results: [{
              id: 1,
              substance: "playdough",
              reportedOn: "2025-11-10",
              seizedOn: "2025-11-10",
              amount: 1.1,
              user_id: 1,
            }],
          }),
        },
      } as unknown as Context

      it("returns an an error", async () => {
        const yoga = Server({
          schema,
          context: () => mockContext,
        })

        const response = await yoga.fetch("http://yoga/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              {
                seizures {
                  substance
                }
              }
            `,
          }),
        })

        const result = await response.json()

        expect(result).toEqual(
          expect.objectContaining({
            data: { seizures: null },
            errors: [
              expect.objectContaining({
                message: "Authentication required to access this resource.",
              }),
            ],
          }),
        )
      })
    })
  })
})
