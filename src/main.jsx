import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./Root.jsx";
import "./shared/theme.css";
import { imageUrl } from "./shared/imageUrl";
import { Toaster } from "react-hot-toast";

document.querySelector('link[rel="icon"]')?.setAttribute("href", imageUrl("/favicon.svg"));
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </BrowserRouter>
  </StrictMode>,
);
