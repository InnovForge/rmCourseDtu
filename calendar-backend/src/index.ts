import { Hono } from "hono";
import { cors } from "hono/cors";
import router from "./routes";
const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.use("*", async (c, next) => {
	const corsMiddlewareHandler = cors({
		// origin: c.env.CORS_ORIGIN,
    origin: "http://localhost:5173",
    credentials: true,
	});
	return corsMiddlewareHandler(c, next);
});


app.route("/api/v1", router);
export default app;
