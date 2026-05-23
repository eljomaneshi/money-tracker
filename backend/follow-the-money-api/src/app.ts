import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/auth.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import expenseRoutes from "./routes/expense.routes";
import accountRoutes from "./routes/account.routes";
import { startSubscriptionCron } from "./cron/subscriptionCron";

const app = express();

startSubscriptionCron();

const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_WWW,
].filter(Boolean) as string[];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                console.log("Allowed CORS origins:", allowedOrigins);
                return callback(null, true);
            }

            return callback(new Error(`CORS blocked for origin: ${origin}`));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);

app.use(express.json());

app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/subscriptions", subscriptionRoutes);
app.use("/expenses", expenseRoutes);
app.use("/accounts", accountRoutes);

app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
        status: "ok",
        message: "Express + Prisma + MySQL ready",
    });
});

app.use(
    (err: Error, _req: Request, res: Response, _next: NextFunction) => {
        console.error("Error:", err);

        if (err.message.startsWith("CORS blocked")) {
            return res.status(403).json({ error: err.message });
        }

        res.status(500).json({ error: "Internal server error" });
    }
);

export default app;