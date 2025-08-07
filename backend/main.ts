import { createYoga } from "npm:graphql-yoga"
import { schema } from "./schema.ts"
import type { Context } from "./src/types/Context.ts"
import { allowList } from "./src/allowList.ts"
import { DatabaseSync } from "node:sqlite"
import { dataAccessors } from "./src/db.ts"

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

// Dependency Injection for database functions allows for easy testing.
export const db: DatabaseSync = new DatabaseSync("./seizures.db")
const { findOrCreateUser } = dataAccessors(db)

const yoga = createYoga<Context>({
  schema,
  graphiql: true,
  landingPage: false,
  context: () => {
    return {
      isAllowed: allowList(ALLOWED_DOMAINS),
      sql: (strings: TemplateStringsArray, ...vars: (string | number)[]) => {
        // join the segments of the query with a placeholder value:
        const statementWithPlaceholders = strings.join("?")
        console.log({ query: statementWithPlaceholders, vars })
        // use a prepared statement to avoid sql injections:
        return db.prepare(statementWithPlaceholders).run(...vars)
      },
      db,
      findOrCreateUser,
    }
  },
})

// @ts-expect-error the types are broken for this function.
Deno.serve(
  {
    hostname: HOST,
    port: Number(PORT),
    onListen: ({ hostname, port }: { hostname: string; port: number }) => {
      console.info(
        `Server is running on http://${hostname}:${port}${yoga.graphqlEndpoint} 🚀`,
      )
    },
  },
  yoga,
)
