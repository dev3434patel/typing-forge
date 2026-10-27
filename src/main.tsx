import { createRoot } from "react-dom/client";
import ApplicationRoot from "./ApplicationRoot.tsx";
import { startPwaDocumentLifetime } from "./lib/pwa";

startPwaDocumentLifetime();
createRoot(document.getElementById("root")!).render(<ApplicationRoot />);
