import { createRoot } from "react-dom/client";
import "./styles/global.css";
import { HashRouter } from "react-router-dom";
import AppRoutes from "./routes";
/* ------------------------------------------------------------- */

let rootElement = document.getElementById("root");

if (!rootElement) {
  rootElement = document.createElement("div");
  rootElement.id = "root";
  document.body.appendChild(rootElement);
}

// Render React app
const root = createRoot(rootElement);
root.render(
  <HashRouter>
    <AppRoutes />
  </HashRouter>,
);
