import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const Root = () => {
  useEffect(() => {
    if (!document.querySelector('script[src="https://ref-zone.vercel.app/self-xss-warning.js"]')) {
      const script = document.createElement("script");
      script.src = "https://ref-zone.vercel.app/self-xss-warning.js"; // Cambia la URL en producción
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return <App />;
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
