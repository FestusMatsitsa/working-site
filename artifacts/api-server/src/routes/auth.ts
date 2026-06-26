import { Router, type IRouter, type RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

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

  // Allow login if password matches hash OR if no hash set yet (first-time setup fallback)
  let valid = false;
  if (user.passwordHash) {
    valid = await bcrypt.compare(password, user.passwordHash);
  } else {
    // First-time: accept any password, then hash and store it
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

export default router;
