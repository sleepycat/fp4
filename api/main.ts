import { Server } from "./src/Server.ts"
import { schema } from "./src/schema.ts"
import { allowList } from "./src/allowList.ts"
import { DatabaseSync } from "node:sqlite"
import type { Context } from "./src/types/Context.ts"
import { dataAccessors } from "./src/db.ts"
import {
  EmailPersonalisation,
  NotifyClient,
} from "npm:notifications-node-client"
import { useEncryptedJWT } from "./src/useEncryptedJWT.ts"

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

const jwtfunctions = useEncryptedJWT({
  base64secret: JWT_SECRET,
  enforce: { issuer: JWT_ISSUER, audience: "fp4" },
})

const context: Partial<Context> = {
  db,
  ...dataAccessors(db),
  ...jwtfunctions,
  isAllowed: allowList(ALLOWED_DOMAINS),
  sendMagicLink(address: string, variables: EmailPersonalisation) {
    const client = new NotifyClient(
      "https://api.notification.canada.ca",
      NOTIFY_API_KEY,
    )
    return client.sendEmail(NOTIFY_TEMPLATE_ID, address, {
      personalisation: variables,
    })
  },
}

const server = Server({
  schema,
  context,
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
