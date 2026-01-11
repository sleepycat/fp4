import { describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import {
    graphql,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLString,
} from "graphql"
import { ReportingYear } from "../ReportingYear.ts"

const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: "Query",
        fields: () => ({
            testField: {
                type: new GraphQLNonNull(ReportingYear),
                args: {
                    year: {
                        type: new GraphQLNonNull(ReportingYear),
                    },
                },
                resolve: (_source: unknown, { year }: { year: number }) => {
                    return year
                },
            },
        }),
    }),
})

describe("ReportingYear", () => {
    const currentYear = new Date().getFullYear()

    describe("parseValue (Variables)", () => {
        it("accepts a valid year as number", async () => {
            const result = await graphql({
                schema,
                source: `query ($year: ReportingYear!) { testField(year: $year) }`,
                variableValues: { year: 2020 },
            })
            expect(result.data).toEqual({ testField: 2020 })
        })

        it("accepts a valid year as string", async () => {
            const result = await graphql({
                schema,
                source: `query ($year: ReportingYear!) { testField(year: $year) }`,
                variableValues: { year: "2020" },
            })
            expect(result.data).toEqual({ testField: 2020 })
        })

        it("accepts the current year", async () => {
            const result = await graphql({
                schema,
                source: `query ($year: ReportingYear!) { testField(year: $year) }`,
                variableValues: { year: currentYear },
            })
            expect(result.data).toEqual({ testField: currentYear })
        })

        it("accepts 2010", async () => {
            const result = await graphql({
                schema,
                source: `query ($year: ReportingYear!) { testField(year: $year) }`,
                variableValues: { year: 2010 },
            })
            expect(result.data).toEqual({ testField: 2010 })
        })

        it("rejects year before 2010", async () => {
            const result = await graphql({
                schema,
                source: `query ($year: ReportingYear!) { testField(year: $year) }`,
                variableValues: { year: 2009 },
            })
            expect(result.errors).toBeDefined()
            expect(result.errors![0].message).toMatch(/Not a valid ReportingYear/)
        })

        it("rejects future year", async () => {
            const result = await graphql({
                schema,
                source: `query ($year: ReportingYear!) { testField(year: $year) }`,
                variableValues: { year: currentYear + 1 },
            })
            expect(result.errors).toBeDefined()
            expect(result.errors![0].message).toMatch(/Not a valid ReportingYear/)
        })

        it("rejects non-integer values", async () => {
            const result = await graphql({
                schema,
                source: `query ($year: ReportingYear!) { testField(year: $year) }`,
                variableValues: { year: 2020.5 },
            })
            expect(result.errors).toBeDefined()
            expect(result.errors![0].message).toMatch(/Not a valid ReportingYear/)
        })
    })

    describe("parseLiteral (Query Args)", () => {
        it("accepts a valid year literal", async () => {
            const result = await graphql({
                schema,
                source: `{ testField(year: 2020) }`,
            })
            expect(result.data).toEqual({ testField: 2020 })
        })

        it("rejects year before 2010 literal", async () => {
            const result = await graphql({
                schema,
                source: `{ testField(year: 2009) }`,
            })
            expect(result.errors).toBeDefined()
            expect(result.errors![0].message).toMatch(/Not a valid ReportingYear/)
        })

        it("rejects future year literal", async () => {
            const result = await graphql({
                schema,
                source: `{ testField(year: ${currentYear + 1}) }`,
            })
            expect(result.errors).toBeDefined()
            expect(result.errors![0].message).toMatch(/Not a valid ReportingYear/)
        })
    })

    describe("serialize (Response)", () => {
        // The resolve function returns the value, which then goes through serialize.
        // We've been implicitly testing serialize in the above tests because
        // result.data contains the serialized value.
        // However, to be explicit about ensuring serialize handles invalid values correctly
        // (e.g. if the backend somehow produces bad data):

        it("serializes valid values correctly", async () => {
            // This is covered by previous tests, but explicitly:
            const result = await graphql({
                schema,
                source: `{ testField(year: 2020) }`,
            })
            expect(result.data?.testField).toBe(2020)
        })

        // We can't easily force the resolver to return a bad value that passes validation *into* the resolver 
        // but fails serialization, unless we bypass the input type validation.
        // But we can test the scalar function directly if we want, or define a schema where the field returns 
        // the scalar but args are ignored/loose.
    })
})
