import './App.css';
import { Flag, SVG } from "./Signature.tsx";

const App = () => {
  return (
    <div className="content" style={{ justifySelf: "center" }}>
      <section
        style={{ display: "flex" }}
      >
        <SVG>
          <title>Canadian Flag</title>
          <Flag style={{ fill: "#ea2d37" }} />
        </SVG>
        <span
          style={{
            paddingLeft: "0.8em",
            lineHeight: "1em",
            textAlignLast: "left",
          }}
        >
          Government of<br /> Canada
        </span>
      </section>
      <p>Start building amazing things with Rsbuild.</p>
    </div>
  );
};

export default App;
