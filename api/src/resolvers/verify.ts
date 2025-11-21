import type { Context } from "../types/Context.ts"
import { GraphQLError } from "graphql"
import { isExpired } from "../isExpired.ts"
import { sha256 } from "../sha256.ts"

export async function verify(
  _parent: undefined,
  { token }: { token: string },
  { db, jwt, request, rateLimiter, remoteAddress }: Context,
) {
  // remoteAddr will be here in production. If so, rate limit against that.
  if (remoteAddress) {
    // rate limit this function to prevent guessing.
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

  // Create a SHA-256 Hash of token: we can store these without worrying about leakage.
  const hash = await sha256(token)

  // First check: Is this old/expired?

  // Stateless expiry check!
  // Ulids embed a timestamp along with some randomness.
  // That means that we can simply:
  // decodeTime(token) and reject if older than 15 minutes.
  if (isExpired({ token, minutesTillExpiry: 15 })) {
    // It's old.
    // just delete the old hash if one exists.
    db.deleteHash(hash)
    throw new GraphQLError(
      "Token expired.",
      {
        extensions: {
          code: "EXPIRED_TOKEN",
          http: { status: 401 },
        },
      },
    )
  }

  // Second check: Did we issue this token?

  // Look up hash in magic_links in transaction:
  // * no records == invalid: someone just made thier own ulid and sent it to us
  // * user_id returned == valid: we issued a token and stored the user id/hash
  // * immediately delete in same transation
  const { err, results } = db.consumeMagicLink(hash)
  if (err) {
    throw new GraphQLError(
      "Invalid token.",
      {
        extensions: {
          code: "INVALID_TOKEN",
          http: { status: 401 },
        },
      },
    )
  }
  // If we got here the token was:
  // 1) issued by us
  // 2) less than 15 minutes ago.

  // console.log({
  //   token,
  //   hash,
  //   results,
  // })

  // XXX: Align jwt expiry with cookie expiry
  //
  // Set auth cookie with expiry date:
  // * HttpOnly: True (prevents JavaScript access, to prevent theft/reuse)
  // * Secure: True (only sent over HTTPS)
  // * SameSite: 'Strict' or 'Lax' (CSRF protection: can't be sent from another site)
  // * Expires: Set the cookie expiration to match the session's expires_at time.
  // * Path: '/'
  await request.cookieStore?.set({
    name: "__Host-fp4auth", // __Host- prefix attaches the cookie to the host (foo.example.com) and not the registrable domain (example.com) *and* requires https
    value: await jwt.encrypt({
      email: results?.email,
      user_id: results!.id,
    }),
    // TODO: need to pass expiry to align with cookie
    // expires: without explicit expiry, cookies are deleted when "the current session is over",
    // but browsers keep/restore browsing sessions making it unclear
    // when/if these cookies would expire https://issues.chromium.org/issues/40217179
    // This is creating a unix timestamp + a days worth of milliseconds
    expires: Date.now() + 86400000, // one day. 60000 is one minute.
    path: "/", // This controls the paths (example.com/foo/bar) the cookie will be sent to. '/' means all of them.
    domain: "", // no domain can be set when using __Host-
    secure: true, // secure (only send when using https)
    sameSite: "lax", // don't send from other sites
    httpOnly: true, // do not make this cookie available to Javascript via document.cookie. Mitigates XXS.
  })
  return token
}
