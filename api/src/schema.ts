import { Context } from "./types/Context.ts"
import { createSchema } from "npm:graphql-yoga"
import { rateLimitDirective } from "npm:graphql-rate-limit-directive"
import { EmailAddressResolver } from "npm:graphql-scalars"
import { GraphQLULID } from "./ULID.ts"
import { monotonicUlid } from "jsr:@std/ulid"
import { isExpired } from "./isExpired.ts"
import { sha256 } from "./sha256.ts"

type User = {
  id: number
  email: string
  created_at: string
}
const { rateLimitDirectiveTypeDefs, rateLimitDirectiveTransformer } =
  rateLimitDirective()

export const schema = rateLimitDirectiveTransformer(createSchema({
  typeDefs: [
    rateLimitDirectiveTypeDefs,
    /* GraphQL */ `
    scalar EmailAddress
    scalar ULID

    type Query {
      hello: String
      seizures: String
    }

    type Mutation {
      # Provide an email address to log in via magic links
      login(email: EmailAddress!): String @rateLimit(limit: 5, duration: 60)
      # Verify the token you recieved to create a session.
      verify(token: ULID!): String @rateLimit(limit: 5, duration: 60)
    }
  `,
  ],
  resolvers: {
    EmailAddress: EmailAddressResolver,
    ULID: GraphQLULID,
    Mutation: {
      login: async (
        _parent,
        { email },
        { db, isAllowed, sendMagicLink }: Context,
      ) => {
        // DONE: Check rate limit. Handled at the schema level by graphql-rate-limit-directive to prevent brute force guessing.
        const abiguousMessage =
          "If an account exists for this email, a login link has been sent."
        // DONE: Split user from domain and check if email is on allow-list: Check ALLOWED_DOMAINS env var. return generic message
        if (!isAllowed(email)) {
          // DONE: Return generic message to prevent user enumeration:
          return abiguousMessage
        }
        // DONE: Find or create user/email in sqlite
        const user = db.findOrCreateUser(email) as User
        // DONE: generate monotonic ulid (monotonicUlid) token: tokens at the same time are still different
        // ulid: embedded timestamp + 80 bits of randomness.
        // This allows us skip storing created_at/expires_at values.
        // DONE: hashed_token = SHA256(monoticUlid())
        const ulid = monotonicUlid()
        const hash = await sha256(ulid)
        // DONE: CREATE TABLE magic_links (id: integer primary key autoincrement, token_hash: text, email: string);
        // DONE: Save hashed token (not the token) to sqlite. This prevents leaks of tokens (assuming a breach of the database).
        db.saveHash({ hash, user_id: user?.id })
        // TODO: send email using notification.canada.ca. Use client provided by graphql context.
        const _response = await sendMagicLink(email, { code: ulid })
        console.log({ email, isAllowed: isAllowed(email), ulid, hash })
        // DONE: Return generic message to prevent user enumeration:
        return abiguousMessage
      },
      // TODO: change type from string to ulid
      verify: async (
        _parent,
        { token }: { token: string },
        { db, jwt, request },
      ) => {
        // Stateless expiry check because of ulid timestamp: decodeTime(token) reject if older than 15 minutes.

        // DONE: Create a SHA-256 Hash of token
        const hash = await sha256(token)

        if (isExpired({ token, minutesTillExpiry: 15 })) {
          // just delete the old hash.
          db.deleteHash(hash)
          return "Your token has expired."
        }
        // DONE: Look up hash in magic_links in transaction:
        // * no records == invalid
        // * user_id returned == valid
        // * immediately delete in same transation
        const { err, results } = db.consumeMagicLink(hash)
        console.log({
          err,
          token,
          hash,
          email: results?.email,
        })

        // XXX: Align jwt expiry with cookie expiry
        //
        // DONE: Set cookie with expiry date:
        // * HttpOnly: True (prevents JavaScript access, to prevent theft/reuse)
        // * Secure: True (only sent over HTTPS)
        // * SameSite: 'Strict' or 'Lax' (CSRF protection: can't be sent from another site)
        // * Expires: Set the cookie expiration to match the session's expires_at time.
        // * Path: '/'
        await request.cookieStore?.set({
          // TODO: make this a variable if it's going to be used all over the place.
          name: "__Host-fp4auth", // __Host- prefix attaches the cookie to the host and not the registrable domain and requires https
          value: await jwt.encrypt({ email: results?.email, user_id: 1 }), // TODO: need to pass expiry to align with cookie
          // expires: without explicit expiry, cookies are deleted when "the current session is over",
          // but browsers keep/restore browsing sessions making it unclear
          // when/if these cookies would expire https://issues.chromium.org/issues/40217179
          // This is creating a unix timestamp + a days worth of milliseconds
          expires: Date.now() + 60000, // one minute // one day: 86400000, // TODO: this needs some thinking.
          path: "/", // This controls the paths (example.com/foo/bar) the cookie will be sent to. '/' means all of them.
          domain: "", // no domain can be set when using __Host-
          secure: true, // secure (only send when using https)
          sameSite: "lax", // don't send from other sites
          // httpOnly: true, // do not make this cookie available to Javascript via document.cookie
        })
        return token
      },
    },
    Query: {
      hello: () => "world",
      seizures: async (_root, _args, { jwt, request }) => {
        // TODO: simplify this. It's way to complicated.
        const cookie = await request.cookieStore?.get("__Host-fp4auth")
        if (cookie) {
          const { err, payload } = await jwt.decrypt(String(cookie?.value))
          if (err) {
            await request.cookieStore?.delete("__Host-fp4auth")
          } else {
            console.log({ authenticated: true, cookie: cookie.value, payload })
            return "logged in!"
          }
        } else {
          console.log({ authenticated: false, public: true })
          return "not logged in. Public access only."
        }
      },
    },
  },
}))
