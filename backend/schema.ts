import { Context } from "./src/types/Context.ts"
import { createSchema } from "npm:graphql-yoga"
import { rateLimitDirective } from "npm:graphql-rate-limit-directive"
import { EmailAddressResolver } from "npm:graphql-scalars"
import { monotonicUlid } from "jsr:@std/ulid"
import { crypto } from "jsr:@std/crypto"
import { encodeHex } from "jsr:@std/encoding/hex"

const { rateLimitDirectiveTypeDefs, rateLimitDirectiveTransformer } =
  rateLimitDirective()

async function generateUlidAndHash() {
  const token = monotonicUlid()
  const hashbuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  )
  const hashed_token = encodeHex(hashbuffer)
  return Promise.resolve({
    ulid: token,
    hash: hashed_token,
  })
}

export const schema = rateLimitDirectiveTransformer(createSchema({
  typeDefs: [
    rateLimitDirectiveTypeDefs,
    /* GraphQL */ `
    scalar EmailAddress

    type Query {
      hello: String
    }

    type Mutation {
      # Provide an email address to log in via magic links
      login(email: EmailAddress!): String @rateLimit(limit: 5, duration: 60)
      # Verify the token you recieved to create a session.
      verify(token: String!): String @rateLimit(limit: 5, duration: 60)
    }
  `,
  ],
  resolvers: {
    EmailAddress: EmailAddressResolver,
    Mutation: {
      login: async (
        _parent,
        { email },
        { isAllowed, findOrCreateUser, saveHash }: Context,
      ) => {
        // DONE: Check rate limit. Handled at the schema level by graphql-rate-limit-directive to prevent brute force guessing.
        const abiguousMessage =
          "If an account exists for this email, a login link has been sent."
        // DONE: Split user from domain and check if email is on allow-list: Check ALLOWED_DOMAINS env var. return generic message
        console.log({ email, isAllowed: isAllowed(email) })
        if (!isAllowed(email)) {
          // DONE: Return generic message to prevent user enumeration:
          return abiguousMessage
        }
        // DONE: Find or create user/email in sqlite
        findOrCreateUser(email)
        // DONE: generate monotonic ulid (monotonicUlid) token: tokens at the same time are still different
        // ulid: embedded timestamp + 80 bits of randomness.
        // This allows us skip storing created_at/expires_at values.
        // DONE: hashed_token = SHA256(monoticUlid())
        const { ulid, hash } = await generateUlidAndHash()
        // DONE: CREATE TABLE magic_links (id: integer primary key autoincrement, token_hash: text, email: string);
        // DONE: Save hashed token (not the token) to sqlite. This prevents leaks of tokens (assuming a breach of the database).
        saveHash({ hash, email })
        // TODO: send email using notification.canada.ca. Use client provided by graphql context.
        console.log({ sending: true, email, ulid, hash })
        // DONE: Return generic message to prevent user enumeration:
        return abiguousMessage
      },
      verify: (_parent, { token }: { token: string }) => {
        // Stateless expiry check because of ulid timestamp: decodeTime(token) reject if older than 15 minutes.
        // https://jsr.io/@std/ulid/doc/decode-time/~/decodeTime
        // Create a SHA-256 Hash of token
        // Look up hash in magic_links in transaction: (learn how to do this in sqlite)
        // * no records == invalid
        // * user_id returned == valid
        // * immediately delete in same transation
        // Set cookie with expiry date:
        // * HttpOnly: True (prevents JavaScript access)
        // * Secure: True (only sent over HTTPS)
        // * SameSite: 'Strict' or 'Lax' (CSRF protection)
        // * Expires: Set the cookie expiration to match the session's expires_at time.
        // * Path: '/'
        return token
      },
    },
    Query: {
      hello: () => "world",
    },
  },
}))
