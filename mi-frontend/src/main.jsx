import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const Root = () => {
  useEffect(() => {
    // Solo cargar el warning de self-XSS en desarrollo
    const isDevelopment = import.meta.env.DEV;
    
    if (isDevelopment) {
      const apiUrl = 'http://localhost:5000';
      const scriptUrl = `${apiUrl}/self-xss-warning.js`;
      
      if (!document.querySelector(`script[src="${scriptUrl}"]`)) {
        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.onerror = () => {
          // Silenciar error si el backend no está disponible
          console.log('Self-XSS warning script not available');
        };
        document.body.appendChild(script);
      }
    }
  }, []);

  return <App />;
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);