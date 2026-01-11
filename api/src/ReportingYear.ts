import { GraphQLError, GraphQLScalarType, Kind, ValueNode } from "graphql"

function isOK(value: number): boolean {
    const currentYear = new Date().getFullYear()
    return Number.isInteger(value) && value >= 2010 && value <= currentYear
}

export const ReportingYear = new GraphQLScalarType({
    name: "ReportingYear",
    description: "A four-digit integer between 2010 and the current year",

    parseValue(value: unknown) {
        if (typeof value === "number") {
            if (isOK(value)) {
                return value
            }
        } else if (typeof value === "string") {
            const intVal = parseInt(value, 10)
            if (!isNaN(intVal) && isOK(intVal) && intVal.toString() === value) {
                return intVal
            }
        }
        throw new GraphQLError("Not a valid ReportingYear")
    },

    serialize(value: unknown) {
        if (typeof value === "number" || typeof value === "string") {
            const intVal = typeof value === "string" ? parseInt(value, 10) : value
            if (isOK(intVal)) {
                return intVal
            }
        }
        throw new GraphQLError("Not a valid ReportingYear")
    },

    parseLiteral(ast: ValueNode) {
        if (ast.kind === Kind.INT) {
            const val = parseInt(ast.value, 10)
            if (isOK(val)) {
                return val
            }
        }
        throw new GraphQLError("Not a valid ReportingYear")
    },
})
