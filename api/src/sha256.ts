import { crypto } from "jsr:@std/crypto"
import { encodeHex } from "jsr:@std/encoding/hex"

export async function sha256(token: string) {
  const hashbuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  )
  const hashed_token = encodeHex(hashbuffer)
  return Promise.resolve(
    hashed_token,
  )
}
