import express from "express";
import multer from "multer";
import {
  createOrder,
  createTable,
  deleteMenuItem,
  deleteTable,
  ensureSeedData,
  getCategories,
  getDashboardSummary,
  getHealth,
  getMenuItems,
  getOrders,
  getRevenueSeries,
  getTables,
  previewOrder,
  reorderTables,
  upsertMenuItem
} from "../services/restaurantService.js";

const upload = multer({ storage: multer.memoryStorage() });
export const apiRouter = express.Router();

apiRouter.use(async (_req, _res, next) => {
  try {
    await ensureSeedData();
    next();
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/health", async (_req, res, next) => {
  try {
    res.json(await getHealth());
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/dashboard/summary", async (req, res, next) => {
  try {
    res.json(await getDashboardSummary(req.query.range));
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/dashboard/revenue", async (req, res, next) => {
  try {
    res.json(await getRevenueSeries(req.query.range));
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/tables", async (_req, res, next) => {
  try {
    res.json(await getTables());
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/tables", async (req, res, next) => {
  try {
    res.status(201).json(await createTable(req.body));
  } catch (error) {
    next(error);
  }
});

apiRouter.patch("/tables/reorder", async (req, res, next) => {
  try {
    res.json(await reorderTables(req.body.orderedIds));
  } catch (error) {
    next(error);
  }
});

apiRouter.delete("/tables/:tableId", async (req, res, next) => {
  try {
    res.json(await deleteTable(req.params.tableId));
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/menu/categories", async (_req, res, next) => {
  try {
    res.json(await getCategories());
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/menu/items", async (req, res, next) => {
  try {
    res.json(
      await getMenuItems({
        category: req.query.category,
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit
      })
    );
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/menu/items", upload.single("image"), async (req, res, next) => {
  try {
    res.status(201).json(await upsertMenuItem(req.body, req.file));
  } catch (error) {
    next(error);
  }
});

apiRouter.put("/menu/items/:menuItemId", upload.single("image"), async (req, res, next) => {
  try {
    res.json(await upsertMenuItem(req.body, req.file, req.params.menuItemId));
  } catch (error) {
    next(error);
  }
});

apiRouter.delete("/menu/items/:menuItemId", async (req, res, next) => {
  try {
    res.json(await deleteMenuItem(req.params.menuItemId));
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/orders/preview", async (req, res, next) => {
  try {
    res.json(await previewOrder(req.body));
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/orders", async (req, res, next) => {
  try {
    res.status(201).json(await createOrder(req.body));
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/orders", async (req, res, next) => {
  try {
    res.json(await getOrders(req.query.filter));
  } catch (error) {
    next(error);
  }
});
