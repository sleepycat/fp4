import { Trans } from "@lingui/react/macro";

const About = () => (
  <>
    <h1>
      <Trans>About</Trans>
    </h1>
    <p>
      <Trans>
        Federal Policing is a core responsibility of the RCMP that is carried
        out in every province and territory in Canada, as well as
        internationally.
      </Trans>
    </p>
  </>
);
const AboutRoute = {
  path: "about",
  Component: About,
};

export default AboutRoute;
