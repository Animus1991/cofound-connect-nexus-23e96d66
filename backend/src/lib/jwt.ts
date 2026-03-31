import jwt from "jsonwebtoken";

const isProd = process.env.NODE_ENV === "production";
const SECRET = process.env.JWT_SECRET ?? (isProd ? "" : "dev-secret-change-in-production");
if (isProd && !SECRET) {
  throw new Error("JWT_SECRET must be set in production. Add it to your .env file.");
}

export interface TokenPayload {
  userId: string;
  email: string;
}

export function signToken(payload: TokenPayload, expiresIn = "15m"): string {
  return jwt.sign(payload, SECRET, { expiresIn });
}

export function signLongLivedToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}
