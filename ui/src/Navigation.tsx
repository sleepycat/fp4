import { t } from "@lingui/core/macro"
// using the Trans component here not the Trans macro
import { Trans } from "@lingui/react"
import { NavLink as BaseNav } from "react-router"
import { css } from "../styled-system/css/css.mjs"
import { styled } from "../styled-system/jsx/factory.mjs"

const NavLink = styled(BaseNav)`
  padding: 0 1em;
  &.active {
    font-weight: bold;
  }
`

const navClass = css`
  background-color: token(colors.lightgrey);
  border-bottom: 4px solid token(colors.burgundy);
`
const contentClass = css`
  width: 75%;
  margin: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const navLinksClass = css`
  display: flex;
  gap: 1rem;
`

export default function Navigation() {
  return (
    <nav className={navClass}>
      <section className={contentClass}>
        <div className={navLinksClass}>
          <Trans
            id="/"
            render={({ translation }) => {
              return <NavLink to={translation}>{t`Home`}</NavLink>
            }}
          />
          <Trans
            id="/drug-seizures"
            render={({ translation }) => {
              return <NavLink to={translation}>{t`Drug Seizures`}</NavLink>
            }}
          />
          <Trans
            id="/report-seizure"
            render={({ translation }) => {
              return <NavLink to={translation}>{t`Report Seizure`}</NavLink>
            }}
          />
          <Trans
            id="/login"
            render={({ translation }) => {
              return <NavLink to={translation}>{t`Login`}</NavLink>
            }}
          />
        </div>
      </section>
    </nav>
  )
}
