import type { ContextFactory } from "./types/Context.ts"
import { GraphQLSchema } from "graphql"
import { createYoga } from "graphql-yoga"
import { useCookies } from "@whatwg-node/server-plugin-cookies"

export function Server(
  { context, schema }: { context: ContextFactory; schema: GraphQLSchema },
) {
  const yoga = createYoga({
    schema,
    graphiql: true,
    landingPage: false,
    plugins: [
      useCookies(),
    ],
    context,
  })

  return yoga
}
