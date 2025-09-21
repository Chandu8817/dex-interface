import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "./apollo-client";
import "./index.css";
import App from "./App.tsx";
import { AppKitProvider } from "./AppKitProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppKitProvider>
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
    </AppKitProvider>
  </StrictMode>,
);
