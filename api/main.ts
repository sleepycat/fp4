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

function getEnv(key: string): string {
  const value = Deno.env.get(key)
  if (value === undefined) {
    throw new Error(`The ${key} environmental variable must be defined.`)
  }
  return value
}

// Functional core, imperative shell pattern:
// Read from the environment here in the application entry point,
// not elsewhere deeper in the application.
const DB_PATH = getEnv("DB_PATH")
const jwtSecret = getEnv("JWT_SECRET")
const jwtIssuer = getEnv("JWT_ISSUER")
const allowedDomains = getEnv("ALLOWED_DOMAINS")
const notifyApiKey = getEnv("NOTIFY_API_KEY")
const notifyTemplateId = getEnv("NOTIFY_TEMPLATE_ID")
const PORT = Deno.env.get("PORT") || "3000"
const HOST = Deno.env.get("HOST") || "0.0.0.0"

// Dependency Injection for database functions allows for easy testing.
export const db: DatabaseSync = new DatabaseSync(DB_PATH)

const server = Server({
  schema,
  context: createContext({
    db,
    jwtSecret,
    jwtIssuer,
    allowedDomains,
    notifyApiKey,
    notifyTemplateId,
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
