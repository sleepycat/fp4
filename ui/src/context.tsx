import { createContext } from "react-router";
import { cacheExchange, Client, fetchExchange } from "urql";

export const client = new Client({
  url: "/graphql",
  exchanges: [cacheExchange, fetchExchange],
});

export const UrqlClientContext = createContext<Client>();
