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

app.use(
    cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
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
        res.status(500).json({ error: "Internal server error" });
    }
);

export default app;