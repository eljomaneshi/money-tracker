export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
export const JWT_EXPIRES_IN = "7d";

export const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);
export const EMAIL_SECURE = process.env.EMAIL_SECURE === "true";