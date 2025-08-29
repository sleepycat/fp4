import { describe, it } from "jsr:@std/testing/bdd"
import { expect } from "jsr:@std/expect"

import { generateSecret, useEncryptedJWT } from "../useEncryptedJWT.ts"

describe("generateSecret()", () => {
  it("returns a base64 encoded string", async () => {
    const base64key = await generateSecret()
    // these secrets appear to be fixed length random strings.
    expect(base64key).toMatch(/\S{44}/)
  })
})

describe("createEncryptedJwt()", () => {
  it("successfully round-trips an arbitrary key/value", async () => {
    const secret = await generateSecret()

    const { encrypt, decrypt } = useEncryptedJWT({
      base64secret: secret,
      enforce: { issuer: "https://example.com", audience: "fp4" },
    })
    const jwt = await encrypt({
      foo: "bar",
    })
    const { err, payload } = await decrypt(jwt)

    expect(err).toBe(false)
    expect(payload).toMatchObject({
      foo: "bar",
      iss: "https://example.com",
      aud: "fp4",
    })
  })

  it("enforces issuer and audience: appending during encrypt, validating during decrypt", async () => {
    const secret = await generateSecret()
    const { encrypt, decrypt } = useEncryptedJWT({
      base64secret: secret,
      enforce: { issuer: "https://example.com", audience: "test" },
    })
    const jwt = await encrypt({
      foo: "bar",
    })
    const { err, payload } = await decrypt(jwt)

    expect(err).toBe(false)
    expect(payload).toMatchObject({
      foo: "bar",
      iss: "https://example.com",
      aud: "test",
    })
  })
})
