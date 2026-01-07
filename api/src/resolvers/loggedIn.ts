import type { Context } from "../types/Context.ts"

export function loggedIn(
  _parent: unknown,
  _args: unknown,
  context: Context,
): boolean {
  return !!context.authenticatedUser
}
