import React from "react"

export const Trans = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export const t = (strings: TemplateStringsArray, ...values: any[]) => {
  return String.raw({ raw: strings }, ...values)
}
