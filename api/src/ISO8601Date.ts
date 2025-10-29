import { GraphQLError, GraphQLScalarType, Kind } from "graphql"

// Graphql-scalars Date scalar converts the value to a JS Date object at midnight UTC.
// https://the-guild.dev/graphql/scalars/docs/scalars/date
// This is really irritating to insert into a database, and makes the dates
// incorrect; at midnight UTC it's actually a day earlier requiring a bunch of
// faffing about with timezones and conversions.
// Instead of doing any of that, we're just implementing our own Date Scalar.
//
//
function isOK(value: string): boolean {
  if (value.match(/[1-9][0-9]{3}-[0-1][0-2]-[0-3][0-9]/)) {
    if (parseInt(value.split("-")[2]) < 32) {
      return true
    }
  }
  return false
}

export const ISO8601Date = new GraphQLScalarType({
  name: "ISO8601Date",
  description: "A Date in ISO 8601 format: YYYY-MM-DD",

  // name is a value (passed separately to line up with the variables here)
  // so parseValue is called:
  // query widgetByName($name: AlphabeticString!) {
  //   widgets(name: $name)
  // }
  parseValue(value) {
    if (typeof value === "string") {
      // regex: 4 digits, first can't be zero, dash two digits not higher than 12, then two digits
      if (isOK(value)) {
        return value // value from the client
      }
    }
    // otherwise:
    throw new GraphQLError("Not a recognizable ISO 8601 Date")
  },
  serialize(value) {
    return value // value sent to the client
  },
  // name is a string literal, so parseLiteral is called
  // query {
  //   widgets(name: "Soft squishy widget")
  // }
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      if (isOK(ast.value)) {
        return ast.value // ast value is always in string format
      }
    }
    // return null
    throw new GraphQLError("Not a recognizable ISO 8601 Date")
  },
})
