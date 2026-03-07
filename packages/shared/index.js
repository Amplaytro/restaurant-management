export const API_PORT = 4000;

export const orderSummaryRanges = ["daily", "weekly", "monthly"];
export const revenueRanges = ["daily", "weekly", "monthly", "yearly"];
export const orderFilters = ["all", "dine-in", "takeaway", "waitlist", "done"];
export const tableSizes = [2, 4, 6, 8];

export const appCategories = [
  { name: "Pizza", slug: "pizza", tint: "#f7d6c5", glyph: "pizza" },
  { name: "Sides", slug: "sides", tint: "#f1df9d", glyph: "fries" },
  { name: "Veggies", slug: "veggies", tint: "#dceeca", glyph: "veggies" },
  { name: "Noodles", slug: "noodles", tint: "#e7d9c7", glyph: "bowl" },
  { name: "Specials", slug: "specials", tint: "#d7e6f6", glyph: "spark" }
];

export const seedMenuCatalog = [
  {
    name: "Margherita",
    description: "San Marzano tomato, basil, and a delicate mozzarella pull.",
    price: 190,
    averagePreparationTime: 12,
    categorySlug: "pizza",
    stock: 18,
    imageSource: "asset:pizza-margherita"
  },
  {
    name: "Pepperoni",
    description: "Crisped pepperoni cups over rich tomato sauce and mozzarella.",
    price: 220,
    averagePreparationTime: 14,
    categorySlug: "pizza",
    stock: 16,
    imageSource: "asset:pizza-pepperoni"
  },
  {
    name: "Capricciosa",
    description: "Artichoke hearts, olive tapenade, mushrooms, and silky cheese.",
    price: 210,
    averagePreparationTime: 15,
    categorySlug: "pizza",
    stock: 12,
    imageSource: "asset:pizza-capricciosa"
  },
  {
    name: "Bianca Pizza",
    description: "White-sauce base, roasted garlic, ricotta, and black pepper.",
    price: 240,
    averagePreparationTime: 16,
    categorySlug: "specials",
    stock: 10,
    imageSource: "asset:bianca-pizza"
  },
  {
    name: "California Pizza",
    description: "Seasonal toppings with a crisp crust and bright herb finish.",
    price: 260,
    averagePreparationTime: 17,
    categorySlug: "specials",
    stock: 8,
    imageSource: "asset:california-pizza"
  },
  {
    name: "Detroit-Style",
    description: "Caramelized cheese edges and a deep, airy rectangular crust.",
    price: 280,
    averagePreparationTime: 18,
    categorySlug: "specials",
    stock: 9,
    imageSource: "asset:detroit-style"
  },
  {
    name: "Pesto Delight",
    description: "Basil pesto, charred vegetables, parmesan, and fresh rocket.",
    price: 230,
    averagePreparationTime: 13,
    categorySlug: "veggies",
    stock: 11,
    imageSource: "asset:pesto-pizza"
  },
  {
    name: "Veggie Supreme",
    description: "Bell peppers, onions, tomato confit, and herb-roasted olives.",
    price: 205,
    averagePreparationTime: 13,
    categorySlug: "veggies",
    stock: 14,
    imageSource: "asset:veggie-pizza"
  },
  {
    name: "Garden Salad",
    description: "Crisp greens, citrus vinaigrette, avocado, and crunchy seeds.",
    price: 140,
    averagePreparationTime: 8,
    categorySlug: "veggies",
    stock: 20,
    imageSource: "asset:garden-salad"
  },
  {
    name: "Loaded Fries",
    description: "Golden fries with spice dust, aioli, herbs, and chilli crunch.",
    price: 150,
    averagePreparationTime: 10,
    categorySlug: "sides",
    stock: 22,
    imageSource: "asset:loaded-fries"
  },
  {
    name: "Spicy Fries",
    description: "Crisp fries layered with smoky seasoning and chipotle drizzle.",
    price: 155,
    averagePreparationTime: 10,
    categorySlug: "sides",
    stock: 18,
    imageSource: "asset:spicy-fries"
  },
  {
    name: "House Noodles",
    description: "Wok-tossed noodles in a glossy savoury sauce with vegetables.",
    price: 185,
    averagePreparationTime: 11,
    categorySlug: "noodles",
    stock: 15,
    imageSource: "asset:noodles-special"
  }
];

export function createDefaultTables() {
  const capacities = [2, 4, 6, 8];

  return Array.from({ length: 30 }, (_, index) => ({
    number: index + 1,
    displayOrder: index + 1,
    capacity: capacities[index % capacities.length],
    name: "",
    isReserved: false,
    currentOrderId: null
  }));
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

export function resolveApiBase(explicitValue) {
  return explicitValue || `http://localhost:${API_PORT}`;
}

export function buildItemCountLabel(count) {
  return `${count} item${count === 1 ? "" : "s"}`;
}

export function formatOrderId(value) {
  return `ORD-${String(value).padStart(4, "0")}`;
}
