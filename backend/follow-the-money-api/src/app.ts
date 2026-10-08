import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/auth.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import expenseRoutes from "./routes/expense.routes";
import accountRoutes from "./routes/account.routes";
import { startSubscriptionCron } from "./cron/subscriptionCron";
import noteRoutes from "./routes/note.routes";
import accountActionRoutes from "./routes/accountAction.routes";
import prisma from "./prisma";

const app = express();

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

startSubscriptionCron();

const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://moneytracker.online",
    process.env.FRONTEND_URL,
].filter((value, index, self): value is string => !!value && self.indexOf(value) === index);

const corsOptions = {
    origin: (origin: string | undefined, callback: Function) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    optionsSuccessStatus: 204,
};

app.use((req, res, next) => {
    res.header("Vary", "Origin");
    next();
});

app.options("/{*any}", cors(corsOptions));
app.use(cors(corsOptions));

app.use(express.json());

app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/subscriptions", subscriptionRoutes);
app.use("/expenses", expenseRoutes);
app.use("/accounts", accountRoutes);
app.use("/notes", noteRoutes);
app.use("/account-actions", accountActionRoutes);

app.get("/health", async (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    let timer: NodeJS.Timeout | undefined;

    try {
        const timeoutPromise = new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error("Database ping timed out")), 3000);
        });

        await Promise.race([prisma.$queryRaw`SELECT 1`, timeoutPromise]);
        clearTimeout(timer);

        return res.status(200).json({
            status: "ok",
            message: "Express + Prisma + PostgreSQL ready",
            database: "connected",
        });
    } catch (error) {
        if (timer) clearTimeout(timer);
        console.error("Health check database failure:", error);
        return res.status(503).json({
            status: "error",
            message: "Database connectivity check failed",
            database: "disconnected",
        });
    }
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