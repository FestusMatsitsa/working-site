import { Router, type IRouter, type RequestHandler } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import ticketsRouter from "./tickets";
import assetsRouter from "./assets";
import inventoryRouter from "./inventory";
import maintenanceRouter from "./maintenance";
import knowledgeRouter from "./knowledge";
import usersRouter from "./users";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

// Public routes
router.use(healthRouter);
router.use(authRouter);

// Auth guard middleware
const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
};

// Protected routes
router.use(requireAuth);
router.use(ticketsRouter);
router.use(assetsRouter);
router.use(inventoryRouter);
router.use(maintenanceRouter);
router.use(knowledgeRouter);
router.use(usersRouter);
router.use(dashboardRouter);

export default router;
