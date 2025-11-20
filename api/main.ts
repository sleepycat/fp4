import { infoPrefix, type YogaInitialContext } from "graphql-yoga"
import { schema } from "./src/schema.ts"
import { DatabaseSync } from "node:sqlite"
import { EmailPersonalisation, NotifyClient } from "notifications-node-client"
import { dataAccessors } from "./src/db.ts"
import { useEncryptedJWT } from "./src/useEncryptedJWT.ts"
import { allowList } from "./src/allowList.ts"
import { Server } from "./src/Server.ts"
import { RateLimiterMemory } from "rate-limiter-flexible"

const rateLimiter = {
  login: new RateLimiterMemory({
    points: 5, // 6 points
    duration: 60, // Per minute
  }),
  verify: new RateLimiterMemory({
    points: 5, // 6 points
    duration: 60, // Per minute
  }),
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
export const database: DatabaseSync = new DatabaseSync(DB_PATH)

// Helpers that will be injected into the context
const db = dataAccessors(database)
const jwt = useEncryptedJWT({
  base64secret: jwtSecret,
  enforce: { issuer: jwtIssuer, audience: "fp4" },
})
const isAllowed = allowList(allowedDomains)
const notifyClient = new NotifyClient(
  "https://api.notification.canada.ca",
  notifyApiKey,
)

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
    return payload as { user_id: number; email: string }
  } catch (e) {
    console.error(e)
    return undefined
  }
}

const yoga = Server({
  schema,
  context: async (initialContext) => {
    // This function is executed *per request*. If a jwt is present
    // it will be decrypted and placed in the context as "authenticatedUser"
    const authenticatedUser = await getAuthenticatedUser(
      initialContext.request,
      jwt,
    )

    return {
      ...initialContext, // the usual stuff like request/response
      db,
      jwt,
      isAllowed,
      rateLimiter,
      sendMagicLink(address: string, variables: EmailPersonalisation) {
        return notifyClient.sendEmail(notifyTemplateId, address, {
          personalisation: variables,
        })
      },
      authenticatedUser,
    }
  },
})

Deno.serve(
  { hostname: HOST, port: Number(PORT) },
  (request: Request, info) =>
    // @ts-expect-error: request
    // This second argument to the yoga server will be folded into the
    // graphql context object. We're including the originating IP so
    // we can do rate limiting in auth resolver.
    yoga(request, {
      remoteAddress: info.remoteAddr.hostname,
    }),
)
