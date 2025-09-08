import { t } from "@lingui/core/macro";
import Wordmark from "./Wordmark.tsx";
import { css } from "../styled-system/css/css.mjs";

export default function Footer() {
  const footerClass = css`
    padding: 2em;
    /* background-color: #f1f2f3; */
    border-top: 1px solid rgb(51, 51, 51);
  `;
  const contentClass = css`
    margin: auto;
    width: 75%;
    display: flex;
    flex-shrink: 0;
    justify-content: right;
  `;

  const canadaRed = css`
    fill: #ea2d37;
  `;
  return (
    <footer className={footerClass}>
      <section className={contentClass}>
        <Wordmark.SVG
          aria-label={t`Symbol of the Government of Canada`}
          role="img"
          width="10em"
        >
          <Wordmark.Flag className={canadaRed} />
          <Wordmark.Text />
        </Wordmark.SVG>
      </section>
    </footer>
  );
}
