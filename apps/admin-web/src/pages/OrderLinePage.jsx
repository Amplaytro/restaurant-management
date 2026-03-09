import { formatCurrency } from "@final-evaluation/shared";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "../api/client.js";
import styles from "./OrderLinePage.module.css";

function timeLabel(createdAt) {
  const delta = Math.max(0, Date.now() - new Date(createdAt).getTime());
  const minutes = Math.floor(delta / 60000);
  if (minutes < 60) {
    return `${Math.max(1, minutes)} min`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hr`;
  }

  return `${Math.floor(hours / 24)} day`;
}

function orderMatches(query, order) {
  if (!query) {
    return true;
  }

  return `${order.publicOrderId} ${order.customer.name} ${order.type} ${order.tableNumber || "takeaway"}`
    .toLowerCase()
    .includes(query.toLowerCase());
}

function ticketTone(order) {
  if (order.type === "takeaway") {
    return "takeaway";
  }

  if (order.queueStatus === "done") {
    return "done";
  }

  return "processing";
}

function badgeLines(order) {
  if (order.queueStatus === "done") {
    return { primary: "Done", secondary: "Served" };
  }

  if (order.type === "takeaway") {
    return { primary: "Take Away", secondary: "Not Picked" };
  }

  return {
    primary: "Dine In",
    secondary: `Ongoing ${Math.max(1, order.remainingMinutes)} min`,
  };
}

function footerLabel(order) {
  if (order.queueStatus === "done") {
    return "Order Done";
  }

  return `Processing ${order.itemCount}`;
}

export function OrderLinePage() {
  const { searchQuery } = useOutletContext();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .getOrders("all")
      .then(setOrders)
      .catch((requestError) => setError(requestError.message));
  }, []);

  const visibleOrders = useMemo(
    () => orders.filter((order) => orderMatches(searchQuery, order)),
    [orders, searchQuery],
  );

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>Order Line</h1>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.grid}>
        {visibleOrders.map((order) => {
          const tone = ticketTone(order);
          const badge = badgeLines(order);
          const orderCode = order.publicOrderId.replace("ORD-", "# ");

          return (
            <article key={order._id} className={`${styles.card} ${styles[tone]}`}>
              <div className={styles.cardTop}>
                <div className={styles.orderMeta}>
                  <span className={styles.orderCode}>{orderCode}</span>
                  <span className={styles.orderTime}>{timeLabel(order.createdAt)}</span>
                </div>
                <span className={styles.badge}>
                  <strong>{badge.primary}</strong>
                  <span>{badge.secondary}</span>
                </span>
              </div>

              <div className={styles.cardSummary}>
                <h2>
                  {order.type === "dineIn"
                    ? `Table ${String(order.tableNumber || "").padStart(2, "0")}`
                    : "Take Away"}
                </h2>
                <p>{order.itemCount} item{order.itemCount === 1 ? "" : "s"}</p>
              </div>

              <div className={styles.ticket}>
                {order.items.slice(0, 3).map((item) => (
                  <div key={item.menuItemId} className={styles.ticketRow}>
                    <span>1 x</span>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>

              <div className={styles.cardBottom}>
                <span className={styles.customer}>{order.customer.name}</span>
                <span className={styles.total}>{formatCurrency(order.totalAmount)}</span>
              </div>

              <div className={styles.cardFooter}>
                <span className={`${styles.statePill} ${styles[`state${tone[0].toUpperCase()}${tone.slice(1)}`]}`}>
                  {footerLabel(order)}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
