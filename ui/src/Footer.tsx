import { Trans } from "@lingui/react/macro";
import { NavLink } from "react-router";
import { t } from "@lingui/core/macro";
import Wordmark from "./Wordmark.tsx";
import { css } from "../styled-system/css/css.mjs";

export default function Footer() {
  const contentClass = css`
    padding: 1.3em;
    margin: auto;
    width: 75%;
    display: flex;
    flex-shrink: 0;
    justify-content: right;
  `;

  return (
    <footer>
      <section
        className={css`
          background-color: token(colors.black);
          width: 100%;
          color: token(colors.white);
        `}
      >
        <ul
          className={css`
            color: token(colors.white);
            width: 75%;
            padding: 1.3em;
            margin: auto;
            width: 75%;
            display: flex;
            flex-shrink: 0;
          `}
        >
          <li>
            <NavLink to="about">
              <Trans>About</Trans>
            </NavLink>
          </li>
        </ul>
      </section>
      <section className={contentClass}>
        <Wordmark.SVG
          aria-label={t`Symbol of the Government of Canada`}
          role="img"
          width="10em"
        >
          <Wordmark.Flag
            className={css`
              fill: token(colors.canadared);
            `}
          />
          <Wordmark.Text />
        </Wordmark.SVG>
      </section>
    </footer>
  );
}
