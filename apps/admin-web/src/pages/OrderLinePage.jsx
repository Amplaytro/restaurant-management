import { resolveAssetSource } from "@final-evaluation/assets";
import { buildItemCountLabel, formatCurrency } from "@final-evaluation/shared";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "../api/client.js";
import styles from "./OrderLinePage.module.css";

const filterOptions = [
  { key: "all", label: "All" },
  { key: "dine-in", label: "Dine In" },
  { key: "waitlist", label: "Wait List" },
  { key: "takeaway", label: "Take Away" },
  { key: "done", label: "Done" },
];

function timeLabel(createdAt) {
  const delta = Math.max(0, Date.now() - new Date(createdAt).getTime());
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) {
    return "Just now";
  }
  return `${minutes} min ago`;
}

function orderMatches(query, order) {
  if (!query) {
    return true;
  }

  return `${order.publicOrderId} ${order.customer.name} ${order.type} ${order.tableNumber || "takeaway"}`
    .toLowerCase()
    .includes(query.toLowerCase());
}

export function OrderLinePage() {
  const { searchQuery } = useOutletContext();
  const [activeFilter, setActiveFilter] = useState("all");
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .getOrders(activeFilter)
      .then(setOrders)
      .catch((requestError) => setError(requestError.message));
  }, [activeFilter]);

  const counts = useMemo(() => ({
    all: orders.length,
    "dine-in": orders.filter((order) => order.type === "dineIn").length,
    waitlist: orders.filter((order) => order.queueStatus === "waitlist").length,
    takeaway: orders.filter((order) => order.type === "takeaway").length,
    done: orders.filter((order) => order.queueStatus === "done").length,
  }), [orders]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>Order Line</h1>
        <div className={styles.filters}>
          {filterOptions.map((option) => (
            <button
              key={option.key}
              className={`${styles.filterButton} ${activeFilter === option.key ? styles.filterButtonActive : ""}`}
              onClick={() => setActiveFilter(option.key)}
              type="button"
            >
              <span>{option.label}</span>
              <strong>{counts[option.key]}</strong>
            </button>
          ))}
        </div>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.grid}>
        {orders.map((order) => {
          const image = resolveAssetSource(order.items[0]?.imageSource);
          const dimmed = !orderMatches(searchQuery, order);
          return (
            <article key={order._id} className={`${styles.card} ${dimmed ? styles.dimmed : ""}`}>
              <div className={styles.cardTop}>
                <div>
                  <span className={styles.meta}>{timeLabel(order.createdAt)}</span>
                  <h2>{order.type === "dineIn" ? `Table ${String(order.tableNumber || "").padStart(2, "0")}` : "Takeaway"}</h2>
                  <p>{order.publicOrderId}</p>
                </div>
                <span className={`${styles.badge} ${styles[order.queueStatus]}`}>
                  {order.queueStatus === "waitlist" ? "Wait list" : order.type === "dineIn" ? "Dine in" : "Take away"}
                </span>
              </div>

              <div className={styles.imageWrap}>
                <img alt={order.items[0]?.name} src={image} />
              </div>

              <div className={styles.cardBottom}>
                <div>
                  <strong>{buildItemCountLabel(order.itemCount)}</strong>
                  <span>{order.customer.name}</span>
                </div>
                <div>
                  <strong>{order.remainingMinutes} min</strong>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
