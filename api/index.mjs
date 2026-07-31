import { createNitro } from "nitropack";
import handler from "../dist/server/server.js";

const app = createNitro({
  dev: false,
});

export default async function vercelHandler(req, res) {
  try {
    return handler(req, res);
  } catch (error) {
    console.error("Vercel SSR handler error:", error);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
}
