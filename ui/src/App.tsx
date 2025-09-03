import { Trans } from "@lingui/react/macro";
import LocaleSwitcher from "./LocaleSwitcher.tsx";
import "./App.css";
import { Flag, SVG } from "./Signature.tsx";

const App = () => {
  return (
    <div className="content" style={{ justifySelf: "center" }}>
      <LocaleSwitcher />
      <section
        style={{ display: "flex" }}
      >
        <SVG>
          <title>
            <Trans>Canadian Flag</Trans>
          </title>
          <Flag style={{ fill: "#ea2d37" }} />
        </SVG>
        <span
          style={{
            paddingLeft: "0.8em",
            lineHeight: "1em",
            textAlignLast: "left",
          }}
        >
          <Trans>
            Government of<br /> Canada
          </Trans>
        </span>
      </section>
      <p>
        <Trans>Start building amazing things with Rsbuild.</Trans>
      </p>
    </div>
  );
};

export default App;
