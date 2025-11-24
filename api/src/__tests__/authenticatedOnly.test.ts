import { describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import {
  graphql,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql"
import { authenticatedOnly } from "../authenticatedOnly.ts"

describe("authenticatedOnly", () => {
  describe("when the context does not contain an authenticatedUser", () => {
    it("throws an authentication error", async () => {
      const query = new GraphQLObjectType({
        name: "Query",
        fields: {
          hello: {
            type: GraphQLString,
            resolve: authenticatedOnly(() => "world"),
          },
        },
      })

      const result = await graphql({
        schema: new GraphQLSchema({ query }),
        source: "{ hello }",
        contextValue: { authenticatedUser: undefined },
      })

      expect(result.errors).toBeDefined()
      expect(result.errors![0]).toMatchObject({
        message: "Authentication required to access this resource.",
      })
    })
  })
})

describe("authenticatedOnly", () => {
  describe("when an authenticatedUser is present in the context", () => {
    it("executes the wrapped resolver", async () => {
      const query = new GraphQLObjectType({
        name: "Query",
        fields: {
          hello: {
            type: GraphQLString,
            resolve: authenticatedOnly(() => "world"),
          },
        },
      })

      const result = await graphql({
        schema: new GraphQLSchema({ query }),
        source: "{ hello }", // the query
        contextValue: { authenticatedUser: { id: 1 } }, // any truthy value really
      })

      expect(result).toEqual({ data: { hello: "world" } })
    })
  })
})
