// import TitleBar from "./TitleBar.tsx";
import LocaleSwitcher from "./LocaleSwitcher.tsx";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { css } from "../styled-system/css/index.mjs";
import logo from "./rcmp-crest-black.svg?url";

export default function Header() {
  const logoSectionClass = css`
    display: flex;
    align-items: end;
    line-height: 1em;
  `;

  const sectionClass = css`
    width: 15em;
    padding: 1em;
    display: flex;
    justify-content: space-between;
    margin: auto auto;
    width: 75%;
  `;

  return (
    <header>
      <section className={sectionClass}>
        <div className={logoSectionClass}>
          <img
            alt={t`The logo of the RCMP`}
            src={logo}
            className={css`
              float: left;
              padding: 0 1em;
            `}
            width="90px"
            height="66.86px"
          />
          <Trans>
            Royal Canadian
            <br />
            Mounted Police
          </Trans>
        </div>
        <LocaleSwitcher />
      </section>
    </header>
  );
}
