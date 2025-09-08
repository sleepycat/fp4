import { Trans } from "@lingui/react/macro";
import Header from "./Header.tsx";
import Footer from "./Footer.tsx";
import "./App.css";
import { css } from "../styled-system/css/css.mjs";

const content = css`
  background-color: #272727;
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  color: contrast-color(token("colors.background"));
  grid-template-rows: auto 1fr auto;
`;

const mainClass = css`
  width: 75%;
  height: 100%;
  margin: auto auto;
  padding: 1em 2em;
`;

const App = () => {
  return (
    <div className={content}>
      <Header />
      <main className={mainClass}>
        <p>
          <Trans>Start building amazing things with Rsbuild.</Trans>
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default App;
