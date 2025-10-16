import { Trans } from "@lingui/react/macro";

export function Home() {
  return (
    <>
      <h1>
        <Trans>Home</Trans>
      </h1>
      <p>
        <Trans>
          Federal Policing protects Canada, its people, and its interests
          against the greatest domestic and international criminal threats,
          including risks to national security, transnational and serious
          organized crime, and cybercrime.
        </Trans>
      </p>
    </>
  );
}

const HomeRoute = {
  index: true,
  Component: Home,
};

export default HomeRoute;
