import { Router, type IRouter, type RequestHandler } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@workspace/db";
import { usersTable, passwordResetTokensTable } from "@workspace/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { sendPasswordReset } from "../mailer.js";

const router: IRouter = Router();

const RESET_EXPIRES_MINUTES = 60;

router.post("/auth/login", (async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || !user.isActive) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  let valid = false;
  if (user.passwordHash) {
    valid = await bcrypt.compare(password, user.passwordHash);
  } else {
    // First-time login: accept any password and store it hashed
    valid = true;
    const hash = await bcrypt.hash(password, 12);
    await db.update(usersTable).set({ passwordHash: hash }).where(eq(usersTable.id, user.id));
  }

  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  req.session.userId = user.id;
  req.session.userRole = user.role;

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    phone: user.phone ?? null,
  });
}) as RequestHandler);

router.post("/auth/logout", (async (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("ict.sid");
    res.json({ message: "Logged out" });
  });
}) as RequestHandler);

router.get("/auth/me", (async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!user || !user.isActive) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    phone: user.phone ?? null,
  });
}) as RequestHandler);

router.post("/auth/forgot-password", (async (req, res) => {
  const { email } = req.body ?? {};
  // Always return 200 to prevent email enumeration
  if (!email) {
    res.json({ message: "If that email is registered, a reset link has been sent." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (user && user.isActive) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_EXPIRES_MINUTES * 60 * 1000);

    await db.insert(passwordResetTokensTable).values({
      userId: user.id,
      token,
      expiresAt,
    });

    const domain = process.env.REPLIT_DEV_DOMAIN ?? "localhost";
    const resetUrl = `https://${domain}/reset-password?token=${token}`;

    await sendPasswordReset({
      name: user.name,
      email: user.email,
      resetUrl,
      expiresInMinutes: RESET_EXPIRES_MINUTES,
    });
  }

  res.json({ message: "If that email is registered, a reset link has been sent." });
}) as RequestHandler);

router.post("/auth/reset-password", (async (req, res) => {
  const { token, password } = req.body ?? {};
  if (!token || !password || password.length < 6) {
    res.status(400).json({ error: "Token and a password of at least 6 characters are required" });
    return;
  }

  const now = new Date();
  const [row] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.token, token),
        gt(passwordResetTokensTable.expiresAt, now),
        isNull(passwordResetTokensTable.usedAt),
      )
    )
    .limit(1);

  if (!row) {
    res.status(400).json({ error: "This reset link is invalid or has expired." });
    return;
  }

  const hash = await bcrypt.hash(password, 12);

  await db.update(usersTable).set({ passwordHash: hash }).where(eq(usersTable.id, row.userId));
  await db.update(passwordResetTokensTable)
    .set({ usedAt: now })
    .where(eq(passwordResetTokensTable.id, row.id));

  res.json({ message: "Password updated. You can now sign in." });
}) as RequestHandler);

export default router;
