import { describe, it } from "jsr:@std/testing/bdd"
import { expect } from "jsr:@std/expect"
import {
  graphql,
  GraphQLError,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "npm:graphql"
import { ISO8601Date } from "../ISO8601Date.ts"

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: () => ({
      thing: {
        type: GraphQLString,
        args: {
          date: {
            type: new GraphQLNonNull(ISO8601Date),
          },
        },
        resolve: (_source) => {
          return "🍕"
        },
      },
    }),
  }),
})

describe("ISO8601Date", () => {
  describe("parseValue", () => {
    describe("when passed a date as a variable", () => {
      it("accepts an ISO 8610 formatted date", async () => {
        const result = await graphql({
          schema,
          source: `
          query ($date: ISO8601Date!) {
            thing(date: $date)
          }
        `,
          //                      the value for parseValue
          variableValues: { date: "2020-12-12" },
        })

        // we should have gotten data back
        expect(result.data).toEqual({ thing: "🍕" })
      })

      it("rejects years that don't make sense", async () => {
        const result = await graphql({
          schema,
          source: `
          query ($date: ISO8601Date!) {
            thing(date: $date)
          }
        `,
          //                      Year 0?
          variableValues: { date: "0000-12-12" },
        })
        expect(result.errors).toHaveLength(1)
        expect(result.errors![0].message).toMatch(
          /Not a recognizable ISO 8601 Date/,
        )
      })

      it("rejects months that don't make sense", async () => {
        const result = await graphql({
          schema,
          source: `
          query ($date: ISO8601Date!) {
            thing(date: $date)
          }
        `,
          //                            month 13?
          variableValues: { date: "2020-13-12" },
        })

        expect(result.errors).toHaveLength(1)
        expect(result.errors![0].message).toMatch(
          /Not a recognizable ISO 8601 Date/,
        )
      })

      it("rejects days above 31", async () => {
        const result = await graphql({
          schema,
          source: `
          query ($date: ISO8601Date!) {
            thing(date: $date)
          }
        `,
          //                              day 32?
          variableValues: { date: "2000-12-32" },
        })

        expect(result.errors).toHaveLength(1)
        expect(result.errors![0].message).toMatch(
          /Not a recognizable ISO 8601 Date/,
        )
      })
    })
  })

  describe("parseLiteral", () => {
    describe("when passed a literal value from a query", () => {
      it("accepts an ISO 8601 formatted date", async () => {
        const result = await graphql({
          schema,
          //                     a literal  value for parseLiteral
          source: `{ thing(date: "2020-12-12") } `,
        })

        expect(result.data).toEqual({ thing: "🍕" })
      })

      it("rejects years that don't make sense", async () => {
        const result = await graphql({
          schema,
          //                     Year 0!
          source: `{ thing(date: "0000-12-12") } `,
        })

        expect(result.errors).toHaveLength(1)
        expect(result.errors![0].message).toMatch(
          /Not a recognizable ISO 8601 Date/,
        )
      })

      it("rejects months that don't make sense", async () => {
        const result = await graphql({
          schema,
          //                         month 13!
          source: `{ thing(date: "2000-13-12") } `,
        })

        expect(result.errors).toHaveLength(1)
        expect(result.errors![0].message).toMatch(
          /Not a recognizable ISO 8601 Date/,
        )
      })

      it("rejects days that don't make sense", async () => {
        const result = await graphql({
          schema,
          //                           day 34!
          source: `{ thing(date: "2000-12-34") } `,
        })

        expect(result.errors).toHaveLength(1)
        expect(result.errors![0].message).toMatch(
          /Not a recognizable ISO 8601 Date/,
        )
      })
    })
  })
})
