export type AllowListChecker = ReturnType<typeof allowList>

export function allowList(list: string) {
  const allowedDomains = list.split(",")

  function isAllowed(email: string) {
    const domain = email.split("@")[1]
    return allowedDomains.includes(domain)
  }

  return isAllowed
}
