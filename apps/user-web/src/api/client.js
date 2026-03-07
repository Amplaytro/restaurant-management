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

export const userApi = {
  getCategories() {
    return request("/menu/categories");
  },
  getMenuItems(params = {}) {
    const searchParams = new URLSearchParams(params);
    return request(`/menu/items?${searchParams.toString()}`);
  },
  previewOrder(payload) {
    return request("/orders/preview", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  createOrder(payload) {
    return request("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
