import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found");
  document.body.innerHTML = "<div style='padding: 20px; color: red; font-family: Arial, sans-serif;'><h2>Error: Root element not found</h2><p>The &lt;div id=\"root\"&gt;&lt;/div&gt; element is missing from the HTML.</p></div>";
} else {
  try {
    console.log("Attempting to mount React app...");
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("React app mounted successfully");
  } catch (error) {
    console.error("Failed to mount React app:", error);
    rootElement.innerHTML = "<div style='padding: 20px; color: red; font-family: Arial, sans-serif;'><h2>Error loading application</h2><p>Check browser console for details.</p><p>Error: " + (error as Error).message + "</p></div>";
  }
}