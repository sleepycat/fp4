import { Outlet } from "react-router";
import Header from "./Header.tsx";
import Footer from "./Footer.tsx";
import Navigation from "./Navigation.tsx";
import "./App.css";
import { css } from "../styled-system/css/css.mjs";

const content = css`
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
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
      <Navigation />
      {
        /*
         No need for "skip to main content" links:
         "The main role is a non-obtrusive alternative for "skip to main content" links"
         https://www.w3.org/TR/wai-aria/#main
         The <main> element has the role="main" by default.
        */
      }
      <main className={mainClass}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default App;
