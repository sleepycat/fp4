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

export async function getAuthenticatedUser(
  request: YogaInitialContext["request"],
  jwt: ReturnType<typeof useEncryptedJWT>,
) {
  try {
    const cookie = await request.cookieStore?.get(
      "__Host-fp4auth",
    )
    if (cookie === undefined) return undefined
    const { payload } = await jwt.decrypt(cookie.value)
    return payload
  } catch (e) {
    console.error(e)
    return undefined
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
// Only read from the environment here in the application entry point,
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

// Helpers that will be injected into the context
const dbAccess = dataAccessors(db)
const jwt = useEncryptedJWT({
  base64secret: jwtSecret,
  enforce: { issuer: jwtIssuer, audience: "fp4" },
})
const isAllowed = allowList(allowedDomains)
const notifyClient = new NotifyClient(
  "https://api.notification.canada.ca",
  notifyApiKey,
)

const server = Server({
  schema,
  context: async (initialContext) => {
    const authenticatedUser = await getAuthenticatedUser(
      initialContext.request,
      jwt,
    )
    return {
      ...initialContext,
      db: dbAccess,
      jwt,
      isAllowed,
      sendMagicLink(address: string, variables: EmailPersonalisation) {
        return notifyClient.sendEmail(notifyTemplateId, address, {
          personalisation: variables,
        })
      },
      authenticatedUser,
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
        `Server is running on http://${hostname}:${port}${server.graphqlEndpoint} 🚀`,
      )
    },
  },
  server,
)
