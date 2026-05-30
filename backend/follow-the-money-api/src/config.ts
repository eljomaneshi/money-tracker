import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
}

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = "7d";

export const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);
export const EMAIL_SECURE = process.env.EMAIL_SECURE === "true";