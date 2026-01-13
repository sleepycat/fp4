import React from "react"

export const defaultTheme = {}

export const Provider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
)

export const ToastQueue = {
  positive: (...args: any[]) => {},
  neutral: (...args: any[]) => {},
  negative: (...args: any[]) => {},
  info: (...args: any[]) => {},
}
