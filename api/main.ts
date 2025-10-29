import { createYoga } from "graphql-yoga"
import { useCookies } from "@whatwg-node/server-plugin-cookies"
import type { Context } from "./src/types/Context.ts"
import { GraphQLSchema } from "graphql"
import type { YogaInitialContext } from "graphql-yoga"
import { schema } from "./src/schema.ts"
import { DatabaseSync } from "node:sqlite"
import { EmailPersonalisation, NotifyClient } from "notifications-node-client"
import { dataAccessors } from "./src/db.ts"
import { useEncryptedJWT } from "./src/useEncryptedJWT.ts"
import { allowList } from "./src/allowList.ts"

type ContextFactory = (
  initialContext: YogaInitialContext,
) => Context | Promise<Context>

export function Server(
  { context, schema }: { context: ContextFactory; schema: GraphQLSchema },
) {
  return createYoga({
    schema,
    graphiql: true,
    landingPage: false,
    plugins: [
      useCookies(),
    ],
    context,
  })
}

interface ContextDeps {
  db: DatabaseSync
  jwtSecret: string
  jwtIssuer: string
  allowedDomains: string
  notifyApiKey: string
  notifyTemplateId: string
}

export function createContext(
  deps: ContextDeps,
) {
  const dbAccess = dataAccessors(deps.db)
  const jwt = useEncryptedJWT({
    base64secret: deps.jwtSecret,
    enforce: { issuer: deps.jwtIssuer, audience: "fp4" },
  })
  const isAllowed = allowList(deps.allowedDomains)
  const notifyClient = new NotifyClient(
    "https://api.notification.canada.ca",
    deps.notifyApiKey,
  )

  return async function contextFactory(
    initialContext: YogaInitialContext,
  ): Promise<Context> {
    const authenticatedUser = await (async () => {
      try {
        const cookie = await initialContext.request.cookieStore?.get(
          "__Host-fp4auth",
        )
        if (cookie === undefined) return undefined
        const { payload } = await jwt.decrypt(cookie.value)
        return payload
      } catch (e) {
        console.error(e)
        return undefined
      }
    })()
    return {
      ...initialContext,
      db: dbAccess,
      // Pass the whole jwt object
      jwt,
      isAllowed,
      sendMagicLink(address: string, variables: EmailPersonalisation) {
        return notifyClient.sendEmail(deps.notifyTemplateId, address, {
          personalisation: variables,
        })
      },
      authenticatedUser,
    }
  }
}

// Functional core, imperative shell pattern:
// Read from the environment here in the entry point,
// not elsewhere deeper in the application.
const ALLOWED_DOMAINS = Deno.env.get("ALLOWED_DOMAINS")
if (ALLOWED_DOMAINS === undefined) {
  // fail loudly
  throw new Error("The ALLOWED_DOMAINS environmental variable must be defined.")
}
const NOTIFY_API_KEY = Deno.env.get("NOTIFY_API_KEY")
if (NOTIFY_API_KEY === undefined) {
  throw new Error("The NOTIFY_API_KEY envrionmental variable must be defined.")
}
const NOTIFY_TEMPLATE_ID = Deno.env.get("NOTIFY_TEMPLATE_ID")
if (NOTIFY_TEMPLATE_ID === undefined) {
  throw new Error(
    "The NOTIFY_TEMPLATE_ID envrionmental variable must be defined.",
  )
}
const JWT_SECRET = Deno.env.get("JWT_SECRET")
if (JWT_SECRET === undefined || JWT_SECRET == "") {
  throw new Error(
    "The JWT_SECRET envrionmental variable must be defined.",
  )
}
const JWT_ISSUER = Deno.env.get("JWT_ISSUER")
if (JWT_ISSUER === undefined || JWT_ISSUER == "") {
  throw new Error(
    "The JWT_ISSUER envrionmental variable must be defined.",
  )
}
const DB_PATH = Deno.env.get("DB_PATH")
if (DB_PATH === undefined || DB_PATH == "") {
  throw new Error(
    "The DB_PATH envrionmental variable must be defined.",
  )
}

// Reasonable defaults:
const PORT = Deno.env.get("PORT") || 3000
const HOST = Deno.env.get("HOST") || "0.0.0.0"

// Env vars should not be read anywhere else in the app.

// Dependency Injection for database functions allows for easy testing.
export const db: DatabaseSync = new DatabaseSync(DB_PATH)

const server = Server({
  schema,
  context: createContext({
    db,
    jwtSecret: JWT_SECRET,
    jwtIssuer: JWT_ISSUER,
    allowedDomains: ALLOWED_DOMAINS,
    notifyApiKey: NOTIFY_API_KEY,
    notifyTemplateId: NOTIFY_TEMPLATE_ID,
  }),
})

// @ts-expect-error the types are broken for this function.
Deno.serve(
  {
    hostname: HOST,
    port: Number(PORT),
    onListen: ({ hostname, port }: { hostname: string; port: number }) => {
      console.info(
        `Server is running on http://${hostname}:${port}${server.graphqlEndpoint} 🚀`,
      )
    },
  },
  server,
)
