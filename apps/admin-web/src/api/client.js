import { resolveApiBase } from "@final-evaluation/shared";

const API_BASE = resolveApiBase(import.meta.env.VITE_API_URL);

async function request(path, options) {
  const response = await fetch(`${API_BASE}/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

export const adminApi = {
  getDashboardSummary(range) {
    return request(`/dashboard/summary?range=${range}`);
  },
  getRevenue(range) {
    return request(`/dashboard/revenue?range=${range}`);
  },
  getTables() {
    return request("/tables");
  },
  createTable(payload) {
    return request("/tables", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  reorderTables(orderedIds) {
    return request("/tables/reorder", {
      method: "PATCH",
      body: JSON.stringify({ orderedIds }),
    });
  },
  deleteTable(tableId) {
    return request(`/tables/${tableId}`, {
      method: "DELETE",
    });
  },
  getOrders(filter) {
    return request(`/orders?filter=${filter}`);
  },
  getCategories() {
    return request("/menu/categories");
  },
  getMenuItems(params = {}) {
    const searchParams = new URLSearchParams(params);
    return request(`/menu/items?${searchParams.toString()}`);
  },
  async saveMenuItem(formData, menuItemId) {
    const response = await fetch(
      `${API_BASE}/api/menu/items${menuItemId ? `/${menuItemId}` : ""}`,
      {
        method: menuItemId ? "PUT" : "POST",
        body: formData,
      },
    );

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || "Unable to save menu item");
    }

    return payload;
  },
  deleteMenuItem(menuItemId) {
    return request(`/menu/items/${menuItemId}`, {
      method: "DELETE",
    });
  },
};
