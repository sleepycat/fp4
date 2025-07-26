import { createYoga, YogaInitialContext } from "npm:graphql-yoga"
import { schema } from "./schema.ts"
import { allowList } from "./src/allowList.ts"

export interface Context extends YogaInitialContext {
  isAllowed: ReturnType<typeof allowList>
}

// Functional core, imparative shell pattern:
// Read from the environment here in the entry point,
// not elsewhere deeper in the application.
const ALLOWED_DOMAINS = Deno.env.get("ALLOWED_DOMAINS")
if (ALLOWED_DOMAINS === undefined) {
  // fail loudly
  throw new Error("The ALLOWED_DOMAINS environmental variable must be defined.")
}
// Reasonable defaults:
const PORT = Deno.env.get("PORT") || 3000
const HOST = Deno.env.get("HOST") || "0.0.0.0"

const yoga = createYoga<Context>({
  schema,
  graphiql: true,
  landingPage: false,
  context: () => {
    return {
      isAllowed: allowList(ALLOWED_DOMAINS),
    }
  },
})
Deno.serve(
  {
    // @ts-expect-error: the types here are wrong. Correct: https://docs.deno.com/runtime/fundamentals/http_server/#listening-on-a-specific-port
    hostname: HOST,
    port: PORT,
    // @ts-expect-error: the types here are wrong. These values are present.
    onListen({ hostname, port }) {
      console.info(
        `Server is running on http://${hostname}:${port}${yoga.graphqlEndpoint} 🚀`,
      )
    },
  },
  yoga,
)
