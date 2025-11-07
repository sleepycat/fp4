import { describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { graphql } from "graphql"
import { schema } from "../schema.ts"
import type { Context } from "../types/Context.ts"

describe("graphql schema", () => {
  describe("query.seizures", () => {
    describe("given an authenticated user in context", () => {
      const mockContext = {
        authenticatedUser: { user_id: 1, email: "test@example.com" },
        db: {
          getSeizures: () => ({
            err: false,
            results: undefined,
          }),
        },
      } as unknown as Context

      it("returns a list of seizures", async () => {
        const results = await graphql({
          schema,
          source: `
            {
              seizures {
                substance
                amount
              }
            }
          `,
          contextValue: mockContext,
        })
        expect(results).toEqual({ data: { seizures: null } })
      })
    })

    describe("without an authenticated user", () => {
      const mockContext = {
        db: {
          // no authenticatedUser object
          getSeizures: () => ({
            err: false,
            results: undefined,
          }),
        },
      } as unknown as Context

      it("returns a list of seizures", async () => {
        const results = await graphql({
          schema,
          source: `
            {
              seizures {
                substance
                amount
              }
            }
          `,
          contextValue: mockContext,
        })

        expect(results).toEqual({
          data: { seizures: null },
          errors: [
            expect.objectContaining({
              message: expect.stringMatching(/Authentication required/),
            }),
          ],
        })
      })
    })
  })
})
