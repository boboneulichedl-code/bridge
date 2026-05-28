import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { applyControlTokens, applyElevationShadows } from "@bridge/ui";
import { App } from "./App";
import "./styles/preview.css";

applyControlTokens(document.documentElement);
applyElevationShadows(document.documentElement);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
