import {
  appCategories,
  createDefaultTables,
  formatOrderId,
  orderFilters,
  orderSummaryRanges,
  revenueRanges,
  seedMenuCatalog,
  tableSizes
} from "@final-evaluation/shared";
import { Chef, Counter, MenuCategory, MenuItem, Order, Table } from "../models/index.js";

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "").slice(-10);
}

function getWindowStart(range) {
  const now = new Date();
  const start = new Date(now);

  if (range === "daily") {
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (range === "weekly") {
    const day = start.getDay();
    const diff = (day + 6) % 7;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getRevenueStart(range) {
  const now = new Date();
  const start = new Date(now);

  if (range === "daily") {
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (range === "weekly") {
    const day = start.getDay();
    const diff = (day + 6) % 7;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (range === "monthly") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function sumOrderValue(order) {
  return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function buildRevenueBuckets(range) {
  if (!revenueRanges.includes(range)) {
    return buildRevenueBuckets("daily");
  }

  if (range === "daily") {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  }

  if (range === "weekly") {
    return ["Week 1", "Week 2", "Week 3", "Week 4"];
  }

  if (range === "monthly") {
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  }

  return ["2022", "2023", "2024", "2025", "2026"];
}

function bucketForDate(date, range) {
  const value = new Date(date);

  if (range === "daily") {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][value.getDay()];
  }

  if (range === "weekly") {
    return `Week ${Math.min(4, Math.floor((value.getDate() - 1) / 7) + 1)}`;
  }

  if (range === "monthly") {
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun"][Math.min(5, value.getMonth())];
  }

  return String(value.getFullYear());
}

function buildRemainingMinutes(processingEndsAt) {
  const diffMs = new Date(processingEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / 60000));
}

function buildDeliveryRemainingMinutes(order) {
  if (!order.estimatedDeliveryMinutes) {
    return 0;
  }

  const processingEndsAt = new Date(order.processingEndsAt).getTime();
  const createdAt = new Date(order.createdAt).getTime();
  const processingDurationMinutes = Math.max(0, Math.ceil((processingEndsAt - createdAt) / 60000));
  const postProcessingMinutes = Math.max(
    0,
    Number(order.estimatedDeliveryMinutes) - processingDurationMinutes,
  );

  if (processingEndsAt > Date.now()) {
    return 0;
  }

  const deliveryEndsAt = processingEndsAt + postProcessingMinutes * 60000;
  const diffMs = deliveryEndsAt - Date.now();
  return Math.max(0, Math.ceil(diffMs / 60000));
}

function shuffle(values) {
  const copy = [...values];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export async function refreshElapsedOrders() {
  const expiredOrders = await Order.find({
    queueStatus: { $ne: "done" },
    processingEndsAt: { $lte: new Date() }
  });

  for (const order of expiredOrders) {
    if (order.type === "takeaway") {
      const deliveryRemainingMinutes = buildDeliveryRemainingMinutes(order);
      order.queueStatus = deliveryRemainingMinutes > 0 ? "served" : "done";
      await order.save();
      continue;
    }

    order.queueStatus = "done";
    await order.save();

    if (order.tableId) {
      await Table.findByIdAndUpdate(order.tableId, {
        isReserved: false,
        currentOrderId: null
      });
    }
  }
}

export async function ensureSeedData() {
  const chefsCount = await Chef.countDocuments();
  if (!chefsCount) {
    await Chef.insertMany([
      { name: "Manesh" },
      { name: "Pritam" },
      { name: "Yash" },
      { name: "Tenzen" }
    ]);
  }

  const tableCount = await Table.countDocuments();
  if (!tableCount) {
    await Table.insertMany(createDefaultTables());
  }

  const categoryCount = await MenuCategory.countDocuments();
  if (!categoryCount) {
    await MenuCategory.insertMany(
      appCategories.map((category, index) => ({
        name: category.name,
        slug: category.slug,
        sortOrder: index + 1,
        iconAsset: category.glyph,
        isActive: true
      }))
    );
  }

  const categories = await MenuCategory.find().sort({ sortOrder: 1 });
  const categoryMap = new Map(categories.map((category) => [category.slug, category._id]));

  const menuCount = await MenuItem.countDocuments();
  if (!menuCount) {
    await MenuItem.insertMany(
      seedMenuCatalog.map((item) => ({
        ...item,
        categoryId: categoryMap.get(item.categorySlug)
      }))
    );
  }

  const counter = await Counter.findOne({ name: "orders" });
  if (!counter) {
    await Counter.create({ name: "orders", value: 8 });
  }

  const ordersCount = await Order.countDocuments();
  if (!ordersCount) {
    const chefs = await Chef.find().sort({ name: 1 });
    const tables = await Table.find().sort({ number: 1 });
    const menuItems = await MenuItem.find();
    const menuMap = new Map(menuItems.map((item) => [item.name, item]));

    const seedOrders = [
      {
        publicOrderId: "ORD-0001",
        type: "dineIn",
        queueStatus: "done",
        assignedChefId: chefs[0]._id,
        tableId: tables[3]._id,
        tableNumber: 4,
        memberCount: 2,
        items: ["Margherita", "Loaded Fries"],
        customer: { name: "Divya", phoneNumber: "9109109109", address: "" },
        cookingInstructions: "Extra basil",
        processingEndsAt: new Date(Date.now() - 60 * 60000),
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60000)
      },
      {
        publicOrderId: "ORD-0002",
        type: "dineIn",
        queueStatus: "processing",
        assignedChefId: chefs[1]._id,
        tableId: tables[8]._id,
        tableNumber: 9,
        memberCount: 4,
        items: ["Pepperoni", "Garden Salad"],
        customer: { name: "Kiran", phoneNumber: "9019019010", address: "" },
        cookingInstructions: "",
        processingEndsAt: new Date(Date.now() + 18 * 60000),
        createdAt: new Date()
      },
      {
        publicOrderId: "ORD-0003",
        type: "takeaway",
        queueStatus: "processing",
        assignedChefId: chefs[2]._id,
        tableId: null,
        tableNumber: null,
        memberCount: null,
        items: ["Capricciosa"],
        customer: {
          name: "Ananya",
          phoneNumber: "9029029020",
          address: "Flat 301, SVR Enclave, Hyper Nagar"
        },
        cookingInstructions: "Cut into squares",
        processingEndsAt: new Date(Date.now() + 28 * 60000),
        estimatedDeliveryMinutes: 42,
        createdAt: new Date()
      },
      {
        publicOrderId: "ORD-0004",
        type: "dineIn",
        queueStatus: "waitlist",
        assignedChefId: chefs[3]._id,
        tableId: null,
        tableNumber: null,
        memberCount: 6,
        items: ["Detroit-Style", "Spicy Fries"],
        customer: { name: "Rahul", phoneNumber: "9039039030", address: "" },
        cookingInstructions: "",
        processingEndsAt: new Date(Date.now() + 34 * 60000),
        createdAt: new Date(Date.now() - 2 * 60 * 60000)
      },
      {
        publicOrderId: "ORD-0005",
        type: "dineIn",
        queueStatus: "done",
        assignedChefId: chefs[0]._id,
        tableId: tables[15]._id,
        tableNumber: 16,
        memberCount: 2,
        items: ["Bianca Pizza"],
        customer: { name: "Samar", phoneNumber: "9049049040", address: "" },
        cookingInstructions: "",
        processingEndsAt: new Date(Date.now() - 120 * 60000),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60000)
      },
      {
        publicOrderId: "ORD-0006",
        type: "takeaway",
        queueStatus: "done",
        assignedChefId: chefs[1]._id,
        tableId: null,
        tableNumber: null,
        memberCount: null,
        items: ["House Noodles", "Garden Salad"],
        customer: {
          name: "Neha",
          phoneNumber: "9059059050",
          address: "Palm Residency, Jubilee Road"
        },
        cookingInstructions: "",
        processingEndsAt: new Date(Date.now() - 90 * 60000),
        estimatedDeliveryMinutes: 38,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60000)
      },
      {
        publicOrderId: "ORD-0007",
        type: "dineIn",
        queueStatus: "done",
        assignedChefId: chefs[2]._id,
        tableId: tables[21]._id,
        tableNumber: 22,
        memberCount: 4,
        items: ["Veggie Supreme"],
        customer: { name: "Ishan", phoneNumber: "9069069060", address: "" },
        cookingInstructions: "",
        processingEndsAt: new Date(Date.now() - 40 * 60000),
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60000)
      },
      {
        publicOrderId: "ORD-0008",
        type: "takeaway",
        queueStatus: "done",
        assignedChefId: chefs[3]._id,
        tableId: null,
        tableNumber: null,
        memberCount: null,
        items: ["Pesto Delight", "Loaded Fries"],
        customer: {
          name: "Mira",
          phoneNumber: "9109109109",
          address: "Skyline Towers, Avenue 4"
        },
        cookingInstructions: "Less spice",
        processingEndsAt: new Date(Date.now() - 55 * 60000),
        estimatedDeliveryMinutes: 35,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60000)
      }
    ];

    const preparedOrders = seedOrders.map((order) => ({
      ...order,
      items: order.items.map((name) => {
        const menuItem = menuMap.get(name);
        return {
          menuItemId: menuItem._id,
          name: menuItem.name,
          quantity: 1,
          price: menuItem.price,
          averagePreparationTime: menuItem.averagePreparationTime,
          imageSource: menuItem.imageSource
        };
      })
    }));

    await Order.insertMany(preparedOrders);

    const reservedNumbers = preparedOrders
      .filter((order) => order.queueStatus !== "done" && order.tableNumber)
      .map((order) => order.tableNumber);

    await Table.updateMany(
      { number: { $in: reservedNumbers } },
      {
        isReserved: true
      }
    );
  }
}

export async function getDashboardSummary(range = "daily") {
  await refreshElapsedOrders();

  const summaryRange = orderSummaryRanges.includes(range) ? range : "daily";
  const startDate = getWindowStart(summaryRange);

  const [orders, chefs, tables] = await Promise.all([
    Order.find().sort({ createdAt: -1 }),
    Chef.find({ active: true }).sort({ name: 1 }),
    Table.find().sort({ displayOrder: 1 })
  ]);

  const totalRevenue = orders.reduce((sum, order) => sum + sumOrderValue(order), 0);
  const uniqueClients = new Set(orders.map((order) => normalizePhone(order.customer.phoneNumber)));
  const scopedOrders = orders.filter((order) => new Date(order.createdAt) >= startDate);

  return {
    stats: {
      chefs: chefs.length,
      totalRevenue,
      totalOrders: orders.length,
      totalClients: uniqueClients.size
    },
    orderSummary: {
      range: summaryRange,
      served: scopedOrders.filter((order) => order.type === "dineIn" && order.queueStatus === "done").length,
      dineIn: scopedOrders.filter((order) => order.type === "dineIn").length,
      takeaway: scopedOrders.filter((order) => order.type === "takeaway").length,
      breakdown: [
        {
          key: "takeaway",
          label: "Take Away",
          count: scopedOrders.filter((order) => order.type === "takeaway").length
        },
        {
          key: "served",
          label: "Served",
          count: scopedOrders.filter((order) => order.type === "dineIn" && order.queueStatus === "done").length
        },
        {
          key: "dineIn",
          label: "Dine In",
          count: scopedOrders.filter((order) => order.type === "dineIn").length
        }
      ]
    },
    chefsTable: chefs.map((chef) => ({
      id: chef._id,
      name: chef.name,
      orderTaken: orders.filter(
        (order) => String(order.assignedChefId) === String(chef._id) && order.queueStatus !== "done"
      ).length
    })),
    tablesPreview: tables.map((table) => ({
      id: table._id,
      number: table.number,
      capacity: table.capacity,
      isReserved: table.isReserved,
      name: table.name
    }))
  };
}

export async function getRevenueSeries(range = "daily") {
  await refreshElapsedOrders();
  const revenueRange = revenueRanges.includes(range) ? range : "daily";
  const startDate = getRevenueStart(revenueRange);
  const buckets = buildRevenueBuckets(revenueRange);
  const orders = await Order.find({ createdAt: { $gte: startDate } });
  const values = Object.fromEntries(buckets.map((bucket) => [bucket, 0]));

  for (const order of orders) {
    const bucket = bucketForDate(order.createdAt, revenueRange);
    if (bucket in values) {
      values[bucket] += sumOrderValue(order);
    }
  }

  return buckets.map((label) => ({
    label,
    value: values[label]
  }));
}

export async function getTables() {
  await refreshElapsedOrders();
  return Table.find().sort({ displayOrder: 1 });
}

export async function createTable(payload) {
  const capacity = Number(payload.capacity);
  if (!tableSizes.includes(capacity)) {
    throw new Error("Capacity must be one of 2, 4, 6, or 8.");
  }

  const count = await Table.countDocuments();
  if (count >= 30) {
    throw new Error("Maximum number of tables (30) reached.");
  }
  return Table.create({
    number: count + 1,
    displayOrder: count + 1,
    capacity,
    name: (payload.name || "").trim()
  });
}

export async function reorderTables(orderedIds = []) {
  const existingTables = await Table.find().sort({ displayOrder: 1 });
  const existingIds = new Set(existingTables.map((table) => String(table._id)));

  if (!orderedIds.length || orderedIds.some((id) => !existingIds.has(String(id)))) {
    throw new Error("Invalid reorder payload.");
  }

  await Promise.all(
    orderedIds.map((id, index) =>
      Table.findByIdAndUpdate(id, {
        displayOrder: index + 1,
        number: index + 1
      })
    )
  );

  return getTables();
}

export async function deleteTable(tableId) {
  const table = await Table.findById(tableId);
  if (!table) {
    throw new Error("Table not found.");
  }

  if (table.isReserved) {
    throw new Error("Reserved tables cannot be deleted.");
  }

  await table.deleteOne();

  const remaining = await Table.find().sort({ displayOrder: 1 });
  await Promise.all(
    remaining.map((item, index) =>
      Table.findByIdAndUpdate(item._id, {
        displayOrder: index + 1,
        number: index + 1
      })
    )
  );

  return getTables();
}

export async function getCategories() {
  return MenuCategory.find({ isActive: true }).sort({ sortOrder: 1 });
}

export async function getMenuItems({ category, search = "", page = 1, limit = 6, includeInactive = false }) {
  const query = includeInactive ? {} : { isActive: true };

  if (category) {
    const targetCategory = await MenuCategory.findOne({ slug: category });
    if (targetCategory) {
      query.categoryId = targetCategory._id;
    }
  }

  if (search.trim()) {
    query.name = { $regex: search.trim(), $options: "i" };
  }

  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 6));
  const safePage = Math.max(1, Number(page) || 1);
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    MenuItem.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    MenuItem.countDocuments(query)
  ]);

  return {
    items,
    page: safePage,
    limit: safeLimit,
    total,
    hasMore: skip + items.length < total
  };
}

export async function upsertMenuItem(payload, file, menuItemId) {
  const existingItem = menuItemId ? await MenuItem.findById(menuItemId) : null;
  const category = payload.category
    ? await MenuCategory.findOne({ slug: payload.category })
    : existingItem
      ? await MenuCategory.findById(existingItem.categoryId)
      : await MenuCategory.findOne({ isActive: true }).sort({ sortOrder: 1 });

  if (!category) {
    throw new Error("At least one active category is required.");
  }

  const document = {
    name: payload.name?.trim(),
    description: payload.description?.trim(),
    price: Number(payload.price),
    averagePreparationTime: Number(payload.averagePreparationTime),
    categoryId: category._id,
    stock: payload.stock ? Number(payload.stock) : existingItem?.stock ?? 10
  };

  if (!document.name || !document.description) {
    throw new Error("Name and description are required.");
  }

  if (Number.isNaN(document.price) || document.price <= 0) {
    throw new Error("Price must be greater than 0.");
  }

  if (Number.isNaN(document.averagePreparationTime) || document.averagePreparationTime <= 0) {
    throw new Error("Average prep time must be greater than 0.");
  }

  if (Number.isNaN(document.stock) || document.stock < 0) {
    throw new Error("Stock must be 0 or greater.");
  }

  if (file) {
    const base64 = file.buffer.toString("base64");
    document.imageSource = `data:${file.mimetype};base64,${base64}`;
  }

  if (menuItemId) {
    return MenuItem.findByIdAndUpdate(menuItemId, document, { new: true });
  }

  if (!document.imageSource) {
    document.imageSource = "asset:pizza-margherita";
  }

  return MenuItem.create(document);
}

export async function deleteMenuItem(menuItemId) {
  const item = await MenuItem.findById(menuItemId);
  if (!item) {
    throw new Error("Menu item not found.");
  }

  item.isActive = false;
  await item.save();
  return item;
}

export async function previewOrder(payload) {
  const items = await MenuItem.find({
    _id: { $in: payload.items.map((item) => item.menuItemId) },
    isActive: true
  });
  const itemMap = new Map(items.map((item) => [String(item._id), item]));
  const preparationMinutes = payload.items.reduce((sum, item) => {
    const menuItem = itemMap.get(String(item.menuItemId));
    return sum + menuItem.averagePreparationTime * item.quantity;
  }, 0);

  if (payload.type === "dineIn") {
    const memberCount = Number(payload.memberCount);
    const table = await Table.findOne({
      isReserved: false,
      capacity: { $gte: memberCount }
    }).sort({ capacity: 1, displayOrder: 1 });

    return {
      type: "dineIn",
      tableAvailable: Boolean(table),
      waitlist: !table,
      table: table
        ? {
            id: table._id,
            number: table.number,
            capacity: table.capacity,
            name: table.name
          }
        : null,
      preparationMinutes
    };
  }

  return {
    type: "takeaway",
    averageDeliveryTime: preparationMinutes + 20,
    preparationMinutes
  };
}

async function getNextOrderId() {
  const counter = await Counter.findOneAndUpdate(
    { name: "orders" },
    { $inc: { value: 1 } },
    { upsert: true, new: true }
  );

  return formatOrderId(counter.value);
}

async function assignChef() {
  const chefs = await Chef.find({ active: true });
  const activeOrders = await Order.find({ queueStatus: { $in: ["waitlist", "processing", "served"] } });
  const loadMap = new Map(chefs.map((chef) => [String(chef._id), 0]));

  for (const order of activeOrders) {
    const key = String(order.assignedChefId);
    loadMap.set(key, (loadMap.get(key) || 0) + 1);
  }

  const sorted = chefs.map((chef) => ({
    chef,
    load: loadMap.get(String(chef._id)) || 0
  }));
  const minimumLoad = Math.min(...sorted.map((entry) => entry.load));
  const candidates = sorted.filter((entry) => entry.load === minimumLoad).map((entry) => entry.chef);
  return shuffle(candidates)[0];
}

export async function createOrder(payload) {
  await refreshElapsedOrders();

  const preview = await previewOrder(payload);
  const selectedItems = await MenuItem.find({
    _id: { $in: payload.items.map((item) => item.menuItemId) },
    isActive: true
  });
  const itemMap = new Map(selectedItems.map((item) => [String(item._id), item]));

  if (selectedItems.length !== payload.items.length) {
    throw new Error("Some menu items are no longer available.");
  }

  const orderItems = payload.items.map((item) => {
    const menuItem = itemMap.get(String(item.menuItemId));

    if (menuItem.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${menuItem.name}.`);
    }

    return {
      menuItemId: menuItem._id,
      name: menuItem.name,
      quantity: Number(item.quantity),
      price: menuItem.price,
      averagePreparationTime: menuItem.averagePreparationTime,
      imageSource: menuItem.imageSource
    };
  });

  const preparationMinutes = orderItems.reduce(
    (sum, item) => sum + item.averagePreparationTime * item.quantity,
    0
  );
  const assignedChef = await assignChef();
  const publicOrderId = await getNextOrderId();
  const processingEndsAt = new Date(Date.now() + preparationMinutes * 60000);

  const order = await Order.create({
    publicOrderId,
    type: payload.type,
    queueStatus: preview.waitlist ? "waitlist" : "processing",
    assignedChefId: assignedChef?._id || null,
    tableId: preview.table?.id || null,
    tableNumber: preview.table?.number || null,
    memberCount: payload.type === "dineIn" ? Number(payload.memberCount) : null,
    items: orderItems,
    customer: {
      name: payload.customer.name.trim(),
      phoneNumber: normalizePhone(payload.customer.phoneNumber),
      address: payload.customer.address?.trim() || ""
    },
    cookingInstructions: payload.cookingInstructions?.trim() || "",
    processingEndsAt,
    estimatedDeliveryMinutes: payload.type === "takeaway" ? preview.averageDeliveryTime : null
  });

  await Promise.all(
    orderItems.map((item) =>
      MenuItem.findByIdAndUpdate(item.menuItemId, {
        $inc: {
          stock: -item.quantity
        }
      })
    )
  );

  if (preview.table?.id) {
    await Table.findByIdAndUpdate(preview.table.id, {
      isReserved: true,
      currentOrderId: order._id
    });
  }

  return order;
}

export async function getOrders(filter = "all") {
  await refreshElapsedOrders();
  const safeFilter = orderFilters.includes(filter) ? filter : "all";
  let orders = await Order.find().sort({ createdAt: -1 }).lean();

  if (safeFilter === "dine-in") {
    orders = orders.filter((order) => order.type === "dineIn");
  } else if (safeFilter === "takeaway") {
    orders = orders.filter((order) => order.type === "takeaway");
  } else if (safeFilter === "waitlist") {
    orders = orders.filter((order) => order.queueStatus === "waitlist");
  } else if (safeFilter === "done") {
    orders = orders.filter((order) => order.queueStatus === "done");
  }

  return orders.map((order) => ({
    ...order,
    remainingMinutes: buildRemainingMinutes(order.processingEndsAt),
    remainingDeliveryMinutes: buildDeliveryRemainingMinutes(order),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: sumOrderValue(order)
  }));
}

export async function getHealth() {
  const [chefs, tables, categories, menuItems, orders] = await Promise.all([
    Chef.countDocuments(),
    Table.countDocuments(),
    MenuCategory.countDocuments(),
    MenuItem.countDocuments(),
    Order.countDocuments()
  ]);

  return {
    ok: true,
    counts: {
      chefs,
      tables,
      categories,
      menuItems,
      orders
    }
  };
}
