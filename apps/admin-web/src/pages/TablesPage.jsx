import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "../api/client.js";
import styles from "./TablesPage.module.css";

function matchesSearch(query, table) {
  if (!query) {
    return true;
  }

  return `${table.number} ${table.name} ${table.capacity}`.toLowerCase().includes(query.toLowerCase());
}

export function TablesPage() {
  const { searchQuery } = useOutletContext();
  const [tables, setTables] = useState([]);
  const [capacity, setCapacity] = useState("2");
  const [name, setName] = useState("");
  const [dragId, setDragId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .getTables()
      .then(setTables)
      .catch((requestError) => setError(requestError.message));
  }, []);

  const tableCount = tables.length;
  const reservedCount = useMemo(() => tables.filter((table) => table.isReserved).length, [tables]);

  async function handleCreateTable(event) {
    event.preventDefault();

    if (tables.length >= 30) {
      setError("Maximum number of tables (30) reached.");
      return;
    }

    try {
      const created = await adminApi.createTable({ capacity: Number(capacity), name });
      setTables((current) => [...current, created]);
      setName("");
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleDeleteTable(tableId) {
    try {
      const nextTables = await adminApi.deleteTable(tableId);
      setTables(nextTables);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleDrop(targetId) {
    if (!dragId || dragId === targetId) {
      return;
    }

    const ordered = [...tables];
    const fromIndex = ordered.findIndex((item) => item._id === dragId);
    const toIndex = ordered.findIndex((item) => item._id === targetId);
    const [moved] = ordered.splice(fromIndex, 1);
    ordered.splice(toIndex, 0, moved);
    setTables(ordered);
    setDragId("");

    try {
      const synced = await adminApi.reorderTables(ordered.map((table) => table._id));
      setTables(synced);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Tables</h1>
          <p>{tableCount} tables, {reservedCount} reserved.</p>
        </div>
        <div className={styles.legend}>
          <span><i className={styles.green} /> Reserved</span>
          <span><i className={styles.white} /> Available</span>
        </div>
      </header>

      <form className={styles.form} onSubmit={handleCreateTable}>
        <select value={capacity} onChange={(event) => setCapacity(event.target.value)}>
          <option value="2">2 Seats</option>
          <option value="4">4 Seats</option>
          <option value="6">6 Seats</option>
          <option value="8">8 Seats</option>
        </select>
        <input
          onChange={(event) => setName(event.target.value)}
          placeholder="Optional table name"
          value={name}
        />
        <button type="submit" disabled={tables.length >= 30}>Add Table</button>
      </form>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.grid}>
        {tables.map((table) => (
          <article
            key={table._id}
            className={`${styles.card} ${table.isReserved ? styles.reserved : ""} ${
              !matchesSearch(searchQuery, table) ? styles.dimmed : ""
            }`}
            draggable
            onDragOver={(event) => event.preventDefault()}
            onDragStart={() => setDragId(table._id)}
            onDrop={() => handleDrop(table._id)}
          >
            <div className={styles.cardHeader}>
              <span>Table</span>
              <strong>{String(table.number).padStart(2, "0")}</strong>
            </div>
            <p className={styles.cardName}>{table.name || `Capacity ${table.capacity}`}</p>
            <p className={styles.cardMeta}>{table.capacity} seats</p>
            <div className={styles.cardFooter}>
              <span>{table.isReserved ? "Reserved" : "Available"}</span>
              <button
                disabled={table.isReserved}
                onClick={() => handleDeleteTable(table._id)}
                type="button"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
