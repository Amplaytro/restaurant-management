import mongoose from "mongoose";

const { Schema } = mongoose;

const chefSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const tableSchema = new Schema(
  {
    number: { type: Number, required: true },
    displayOrder: { type: Number, required: true },
    capacity: { type: Number, required: true },
    name: { type: String, default: "" },
    isReserved: { type: Boolean, default: false },
    currentOrderId: { type: Schema.Types.ObjectId, ref: "Order", default: null }
  },
  { timestamps: true }
);

const menuCategorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    sortOrder: { type: Number, required: true },
    iconAsset: { type: String, default: "" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const menuItemSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    averagePreparationTime: { type: Number, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "MenuCategory", required: true },
    stock: { type: Number, required: true },
    imageSource: { type: String, default: "" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const orderItemSchema = new Schema(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    averagePreparationTime: { type: Number, required: true },
    imageSource: { type: String, default: "" }
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    publicOrderId: { type: String, required: true, unique: true },
    type: { type: String, enum: ["dineIn", "takeaway"], required: true },
    queueStatus: {
      type: String,
      enum: ["waitlist", "processing", "served", "done"],
      required: true
    },
    assignedChefId: { type: Schema.Types.ObjectId, ref: "Chef", default: null },
    tableId: { type: Schema.Types.ObjectId, ref: "Table", default: null },
    tableNumber: { type: Number, default: null },
    memberCount: { type: Number, default: null },
    items: { type: [orderItemSchema], default: [] },
    customer: {
      name: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      address: { type: String, default: "" }
    },
    cookingInstructions: { type: String, default: "" },
    processingEndsAt: { type: Date, required: true },
    estimatedDeliveryMinutes: { type: Number, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

const counterSchema = new Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, required: true, default: 0 }
});

export const Chef = mongoose.models.Chef || mongoose.model("Chef", chefSchema);
export const Table = mongoose.models.Table || mongoose.model("Table", tableSchema);
export const MenuCategory =
  mongoose.models.MenuCategory || mongoose.model("MenuCategory", menuCategorySchema);
export const MenuItem = mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema);
export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);
