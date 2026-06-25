import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ticketsRouter from "./tickets";
import assetsRouter from "./assets";
import inventoryRouter from "./inventory";
import maintenanceRouter from "./maintenance";
import knowledgeRouter from "./knowledge";
import usersRouter from "./users";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ticketsRouter);
router.use(assetsRouter);
router.use(inventoryRouter);
router.use(maintenanceRouter);
router.use(knowledgeRouter);
router.use(usersRouter);
router.use(dashboardRouter);

export default router;
