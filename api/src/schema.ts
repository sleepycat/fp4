import { Context } from "./types/Context.ts"
import { createSchema } from "graphql-yoga"
import { GraphQLError } from "graphql"
import {
  EmailAddressResolver,
  PositiveFloatResolver,
  ULIDResolver,
} from "graphql-scalars"
import { ISO8601Date } from "./ISO8601Date.ts"
import { monotonicUlid } from "@std/ulid"
import { isExpired } from "./isExpired.ts"
import { sha256 } from "./sha256.ts"

type User = {
  id: number
  email: string
  created_at: string
}

export const schema = createSchema({
  typeDefs: [
    /* GraphQL */ `
    scalar EmailAddress
    scalar ULID
    scalar ISO8601Date
    scalar PositiveFloat

    type DrugSeizureRecord {
      substance: String
      seizedOn: ISO8601Date
      reportedOn: ISO8601Date
      amount: PositiveFloat
    }

    type Query {
      hello: String
      seizures: [DrugSeizureRecord]
    }

    input DrugSeizureInput {
      substance: String!
      seizedOn: ISO8601Date!
      reportedOn: ISO8601Date!
      amount: PositiveFloat!
    }

    type Mutation {
      reportDrugSeizure(input: DrugSeizureInput): String
      # Provide an email address to log in via magic links
      login(email: EmailAddress!): String
      # Verify the token you recieved to create a session.
      verify(token: ULID!): String
    }
  `,
  ],
  resolvers: {
    ISO8601Date,
    EmailAddress: EmailAddressResolver,
    ULID: ULIDResolver,
    PositiveFloat: PositiveFloatResolver,
    DrugSeizureRecord: {
      // these exist because the column name has an underscore and the GraphQL schema is camelcase.
      seizedOn: (parent) => parent.seized_on,
      reportedOn: (parent) => parent.reported_on,
    },
    Mutation: {
      // NB: we're choosing a specific name here, instead of something generic
      // like "reportSeizure" (of what?) or just "report" (anything?). The more
      // generic the name is, the more likely you are to run into another usage
      // of the term later... causing conflicts and likely deprecations.
      reportDrugSeizure: (
        _parent,
        { input },
        { db, authenticatedUser }: Context,
      ) => {
        if (authenticatedUser) {
          console.log({
            authenticated: true,
            payload: authenticatedUser,
          })
          const response = db.addSeizure({
            user_id: authenticatedUser.user_id,
            substance: input.substance,
            amount: input.amount,
            seized_on: input.seizedOn,
            reported_on: input.reportedOn,
          })
          console.log({ input, response })
          return "👍"
        } else {
          console.log({ authenticated: false, public: true })
          return "not logged in. Public access only."
        }
      },
      login: async (
        _parent,
        { email },
        { db, isAllowed, sendMagicLink, rateLimiter }: Context,
      ) => {
        // DONE: Check rate limit for this email. Prevent griefing/spam.
        try {
          rateLimiter.login.consume(email, 1)
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
        // console.log({ email, isAllowed: isAllowed(email), ulid, hash })
        // DONE: Return generic message to prevent user enumeration:
        return abiguousMessage
      },
      // TODO: change type from string to ulid
      verify: async (
        _parent,
        { token }: { token: string },
        { db, jwt, request },
      ) => {
        //NOTE: We used to have rate limiting on this function but it's not
        // super meaningful limiting on the token since the actual threat is guessing which
        // implies rate limiting the source IP.
        // We don't have access to the source IP address (graphql yoga doesn't expose it).

        // DONE: Create a SHA-256 Hash of token
        const hash = await sha256(token)

        // Stateless expiry check because of ulid timestamp: decodeTime(token) reject if older than 15 minutes.
        if (isExpired({ token, minutesTillExpiry: 15 })) {
          // just delete the old hash.
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
        // DONE: Look up hash in magic_links in transaction:
        // * no records == invalid
        // * user_id returned == valid
        // * immediately delete in same transation
        const { err, results } = db.consumeMagicLink(hash)
        if (err) {
          console.log({ err, token, hash, results })
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
        // console.log({
        //   token,
        //   hash,
        //   results,
        // })

        // XXX: Align jwt expiry with cookie expiry
        //
        // DONE: Set cookie with expiry date:
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
      },
    },
    Query: {
      hello: () => "world",
      seizures: (_root, _args, { db, authenticatedUser }) => {
        if (authenticatedUser) {
          const results = db.getSeizures()
          return results.results
        } else {
          throw new GraphQLError(
            "Authentication required to access this resource.",
            {
              extensions: {
                code: "UNAUTHENTICATED",
                http: { status: 401 },
              },
            },
          )
        }
      },
    },
  },
})
