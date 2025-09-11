import { createYoga } from "npm:graphql-yoga"
import { useCookies } from "npm:@whatwg-node/server-plugin-cookies"
import type { Context } from "../src/types/Context.ts"
import { GraphQLSchema } from "npm:graphql"

export function Server(
  { context, schema }: { context: Partial<Context>; schema: GraphQLSchema },
) {
  return createYoga<Context>({
    schema,
    graphiql: true,
    landingPage: false,
    plugins: [
      useCookies(),
    ],
    context,
  })
}
