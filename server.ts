import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { registerPortfolioApi } from "./portfolio-api";




const app = express();
const PORT = Number(process.env.PORT || 5190);

app.use(express.json());

// Safe synthetic responses, original AI routes retained.
registerPortfolioApi(app);

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Resident Writer Evaluation Coordinator running on http://localhost:${PORT}`);
  });
}

startServer();
