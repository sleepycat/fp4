import { describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { graphql } from "graphql"
import { schema } from "../schema.ts"
import type { Context } from "../types/Context.ts"
import type { CookieStore } from "@whatwg-node/cookie-store/"

// Augment the global Request interface
declare global {
  interface Request {
    cookieStore?: CookieStore
  }
}

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
  })
})
