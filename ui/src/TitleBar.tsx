import { Trans } from "@lingui/react/macro";
import { css } from "../styled-system/css";

const titleText = css`
  width: 75%;
  margin: auto auto;
  padding: 0.3em 1em;
  font-weight: bold;
`;

const h1Class = css`
  padding: 0 0;
  color: token(colors.white);
  background-color: token(colors.rcmpred);
`;

export default function TitleBar() {
  return (
    <h1 className={h1Class}>
      <section className={titleText}>
        <Trans>Federal Policing</Trans>
      </section>
    </h1>
  );
}
