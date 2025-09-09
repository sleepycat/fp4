import { decodeTime } from "jsr:@std/ulid"

export function isExpired(
  { token, minutesTillExpiry }: { token: string; minutesTillExpiry: number },
) {
  // https://jsr.io/@std/ulid/doc/decode-time/~/decodeTime
  const timestamp = decodeTime(token)
  // 1. Get the Instant representing 15 minutes ago.
  const expiryInstant = Temporal.Now.instant().subtract({
    minutes: minutesTillExpiry,
  })

  // 2. Convert your Unix timestamp to an Instant.
  const timestampInstant = Temporal.Instant.fromEpochMilliseconds(timestamp)

  // 3. Compare the two Instants.
  //    compare() returns -1 if the first instant is earlier, 0 if they are the same, 1 if later.
  return !!(Temporal.Instant.compare(timestampInstant, expiryInstant) ===
    -1)
}
