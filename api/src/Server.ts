import { createYoga } from "npm:graphql-yoga"
import { useCookies } from "npm:@whatwg-node/server-plugin-cookies"
import type { Context } from "../src/types/Context.ts"
import { GraphQLSchema } from "npm:graphql"
import type { YogaInitialContext } from "npm:graphql-yoga"

// Define the context factory function type
type ContextFactory = (initialContext: YogaInitialContext) => Context

export function Server(
  // The context prop is now a factory function
  { context, schema }: { context: ContextFactory; schema: GraphQLSchema },
) {
  return createYoga({
    schema,
    graphiql: true,
    landingPage: false,
    plugins: [
      useCookies(),
    ],
    // Pass the factory function directly to Yoga
    context,
  })
}
