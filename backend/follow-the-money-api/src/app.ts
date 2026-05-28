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

const app = express();

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

app.use("/notes", noteRoutes);
app.use("/account-actions", accountActionRoutes);

export default app;