import { Buffer } from "node:buffer"
import * as jose from "npm:jose"

// https://github.com/panva/jose/blob/2c519cce22b73983a00a0da24f4e319050598749/src/key/generate_secret.ts#L47
type Algorithm =
  | "A256GCM"
  | "HS256"
  | "HS384"
  | "HS512"
  | "A128CBC-HS256"
  | "A192CBC-HS384"
  | "A256CBC-HS512"
  | "A128KW"
  | "A192KW"
  | "A256KW"
  | "A128GCMKW"
  | "A192GCMKW"
  | "A256GCMKW"
  | "A192GCM"
  | "A256GCM"

// create secret key
export async function generateSecret(
  algorithm: Algorithm = "A256GCM",
): Promise<string> {
  const key: Uint8Array | CryptoKey = await jose.generateSecret(algorithm, {
    extractable: true,
  })
  if (key instanceof CryptoKey) {
    const exported = await crypto.subtle.exportKey("raw", key)
    return Buffer.from(new Uint8Array(exported)).toString("base64")
  } else {
    return Buffer.from(key).toString("base64")
  }
}

type Validations = {
  issuer: string
  audience: string
}

export type JwtFunctions = ReturnType<typeof useEncryptedJWT>

// Since the same secrets and data are used for encrypting and decrypting,
// there is fundamental coupling between the two.
// The idea here is to initialize encryption and decryption functions
// in one spot so those function share that state.
export function useEncryptedJWT(
  { base64secret, enforce }: { base64secret: string; enforce: Validations },
) {
  const secret = jose.base64url.decode(base64secret)

  // create encrypted jwt
  function encrypt(payload: jose.JWTPayload) {
    const jot = new jose.EncryptJWT(
      Object.assign(payload, { iss: enforce.issuer, aud: enforce.audience }),
    )
    return jot.setProtectedHeader({ alg: "dir", enc: "A128CBC-HS256" })
      .setExpirationTime("1d").setIssuedAt().encrypt(secret)
  }

  // decrypt and verify an encrypted jwt
  async function decrypt(
    jwt: string,
  ): Promise<{ err: string | boolean; payload: jose.JWTPayload | undefined }> {
    let payload
    try {
      // jwtDecrypt does the decryption using the secret,
      //  and then verification using the values passed for
      //  issuer and audience as well as checking expiry
      ;({ payload } = await jose.jwtDecrypt(jwt, secret, {
        issuer: enforce.issuer,
        audience: enforce.audience,
      }))
    } catch (e: unknown) {
      if (e instanceof Error) {
        return { err: e.message, payload }
      } else {
        return { err: true, payload }
      }
    }
    return { err: false, payload }
  }

  return {
    encrypt,
    decrypt,
  }
}
