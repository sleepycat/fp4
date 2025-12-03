import { GraphQLError } from "graphql"
import type { Context } from "../types/Context.ts"
import { sha256 } from "../sha256.ts"
import { monotonicUlid } from "@std/ulid"

type User = {
  id: number
  email: string
  created_at: string
}

export async function login(
  _parent: undefined,
  { email }: { email: string },
  { db, isAllowed, sendMagicLink, rateLimiter, remoteAddress }: Context,
) {
  // TODO: extract rate limiting into a wrapping function like auth.
  if (remoteAddress) {
    // Check rate limit for this email. Prevent griefing/spam.
    try {
      await rateLimiter.login.consume(remoteAddress, 1)
    } catch (_e: unknown) {
      throw new GraphQLError(
        "Rate limit exceeded. Too many requests.",
        {
          extensions: {
            code: "RATE_LIMITED",
            http: { status: 429 },
          },
        },
      )
    }
  }

  const abiguousMessage =
    "If an account exists for this email, a login link has been sent."

  // Split user from domain and check if email is on allow-list: Check ALLOWED_DOMAINS env var. return generic message
  if (!isAllowed(email)) {
    // Return generic message to prevent user enumeration:
    return abiguousMessage
  }

  // Find or create user/email in sqlite
  const user = db.findOrCreateUser(email) as User

  // generate monotonic ulid (monotonicUlid) token: tokens generated at the same time are still different
  // ulid: embedded timestamp + 80 bits of randomness.
  // This allows us skip storing created_at/expires_at values.
  const ulid = monotonicUlid()
  // console.log({ email, ulid })
  const hash = await sha256(ulid)

  // Save hashed token (not the token) to sqlite.
  // This prevents leaks of tokens (assuming a breach of the database)
  // and serves as a record of the tokens we've issued.
  db.saveHash({ hash, user_id: user?.id })
  console.log({ ulid, email })

  try {
    const _response = await sendMagicLink(email, { code: ulid })
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error({
        notify:
          `Attempted to send magic link to ${email}. Notify responded with: ${e.message}`,
      })
    } else {
      console.error({
        notify:
          `Attempted to send magic link to ${email}. Notify responded with: ${e}`,
      })
    }
  }
  // Return generic message to prevent user enumeration:
  return abiguousMessage
}
