import { formatCurrency } from "@final-evaluation/shared";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "../api/client.js";
import styles from "./DashboardPage.module.css";

function isDimmed(query, ...values) {
  if (!query) {
    return false;
  }

  const haystack = values.join(" ").toLowerCase();
  return !haystack.includes(query.toLowerCase());
}

function buildChartPath(points, width, height) {
  if (!points.length) {
    return "";
  }

  const max = Math.max(...points.map((point) => point.value), 1);
  const xStep = width / Math.max(points.length - 1, 1);

  return points
    .map((point, index) => {
      const x = index * xStep;
      const y = height - (point.value / max) * height;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

const iconMap = {
  "TOTAL CHEF": (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
      <line x1="6" y1="17" x2="18" y2="17" />
    </svg>
  ),
  "TOTAL REVENUE": (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  "TOTAL ORDERS": (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  "TOTAL CLIENTS": (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
};

function StatCard({ label, value, accent, dimmed }) {
  return (
    <article className={`${styles.statCard} ${dimmed ? styles.dimmed : ""}`}>
      <div className={`${styles.statIcon} ${styles[accent]}`}>
        {iconMap[label] || <span />}
      </div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

export function DashboardPage() {
  const { searchQuery } = useOutletContext();
  const [summaryRange, setSummaryRange] = useState("daily");
  const [revenueRange, setRevenueRange] = useState("daily");
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .getDashboardSummary(summaryRange)
      .then(setSummary)
      .catch((requestError) => setError(requestError.message));
  }, [summaryRange]);

  useEffect(() => {
    adminApi
      .getRevenue(revenueRange)
      .then(setRevenue)
      .catch((requestError) => setError(requestError.message));
  }, [revenueRange]);

  const breakdown = summary?.orderSummary.breakdown || [];
  const totalBreakdown = breakdown.reduce((sum, item) => sum + item.count, 0) || 1;
  const donutStops = useMemo(() => {
    let cursor = 0;
    const palette = ["#2f2f2f", "#7a7a7a", "#b7b7b7"];

    return breakdown
      .map((item, index) => {
        const percentage = (item.count / totalBreakdown) * 100;
        const start = cursor;
        cursor += percentage;
        return `${palette[index]} ${start}% ${cursor}%`;
      })
      .join(", ");
  }, [breakdown, totalBreakdown]);

  const chartPath = buildChartPath(revenue, 240, 110);

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  if (!summary) {
    return <p className={styles.loading}>Loading analytics…</p>;
  }

  const statCards = [
    { label: "TOTAL CHEF", value: String(summary.stats.chefs).padStart(2, "0"), accent: "accentLight" },
    { label: "TOTAL REVENUE", value: formatCurrency(summary.stats.totalRevenue), accent: "accentBlue" },
    { label: "TOTAL ORDERS", value: String(summary.stats.totalOrders).padStart(2, "0"), accent: "accentMint" },
    { label: "TOTAL CLIENTS", value: String(summary.stats.totalClients).padStart(2, "0"), accent: "accentSky" },
  ];

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Analytics</h1>

      <div className={styles.statsGrid}>
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            accent={card.accent}
            dimmed={isDimmed(searchQuery, card.label, card.value)}
            label={card.label}
            value={card.value}
          />
        ))}
      </div>

      <div className={styles.insightsGrid}>
        <article className={styles.panelCard}>
          <header className={styles.cardHeader}>
            <div>
              <h2>Order Summary</h2>
              <p>Served, dine in, and takeaway performance for the selected window.</p>
            </div>
            <select value={summaryRange} onChange={(event) => setSummaryRange(event.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </header>

          <div className={styles.summaryStats}>
            <div className={`${styles.summaryMetric} ${isDimmed(searchQuery, "served", summary.orderSummary.served) ? styles.dimmed : ""}`}>
              <strong>{String(summary.orderSummary.served).padStart(2, "0")}</strong>
              <span>Served</span>
            </div>
            <div className={`${styles.summaryMetric} ${isDimmed(searchQuery, "dine in", summary.orderSummary.dineIn) ? styles.dimmed : ""}`}>
              <strong>{String(summary.orderSummary.dineIn).padStart(2, "0")}</strong>
              <span>Dine In</span>
            </div>
            <div className={`${styles.summaryMetric} ${isDimmed(searchQuery, "take away", summary.orderSummary.takeaway) ? styles.dimmed : ""}`}>
              <strong>{String(summary.orderSummary.takeaway).padStart(2, "0")}</strong>
              <span>Take Away</span>
            </div>
          </div>

          <div className={styles.breakdownArea}>
            <div className={styles.donutWrap}>
              <div className={styles.donut} style={{ background: `conic-gradient(${donutStops})` }}>
                <div className={styles.donutInner} />
              </div>
            </div>

            <div className={styles.breakdownList}>
              {breakdown.map((item, index) => {
                const percentage = Math.round((item.count / totalBreakdown) * 100);
                return (
                  <div
                    key={item.key}
                    className={`${styles.breakdownRow} ${isDimmed(searchQuery, item.label, item.count) ? styles.dimmed : ""}`}
                  >
                    <span>{item.label}</span>
                    <em>({percentage}%)</em>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{
                          width: `${Math.max(18, percentage)}%`,
                          background:
                            index === 0 ? "#2f2f2f" : index === 1 ? "#7e7e7e" : "#b5b5b5",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        <article className={styles.panelCard}>
          <header className={styles.cardHeader}>
            <div>
              <h2>Revenue</h2>
              <p>Revenue curve for the selected time range.</p>
            </div>
            <select value={revenueRange} onChange={(event) => setRevenueRange(event.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </header>

          <div className={styles.chartSurface}>
            <div className={styles.chartColumns}>
              {revenue.map((point) => (
                <span key={point.label} />
              ))}
            </div>
            <svg className={styles.chartSvg} viewBox="0 0 240 120" preserveAspectRatio="none">
              <path d={chartPath} fill="none" stroke="#292929" strokeLinecap="round" strokeWidth="2.5" />
            </svg>
            <div className={styles.chartLabels}>
              {revenue.map((point) => (
                <span key={point.label}>{point.label}</span>
              ))}
            </div>
          </div>
        </article>

        <article className={styles.panelCard}>
          <header className={styles.cardHeader}>
            <div>
              <h2>Tables</h2>
              <p>Reserved tables remain green while available tables stay white.</p>
            </div>
            <div className={styles.legend}>
              <span><i className={styles.legendReserved} /> Reserved</span>
              <span><i className={styles.legendAvailable} /> Available</span>
            </div>
          </header>

          <div className={styles.tablesGrid}>
            {summary.tablesPreview.map((table) => (
              <div
                key={table.id}
                className={`${styles.tableCell} ${table.isReserved ? styles.tableCellReserved : ""} ${
                  isDimmed(searchQuery, `table ${table.number}`, table.capacity, table.name) ? styles.dimmed : ""
                }`}
              >
                <span>Table</span>
                <strong>{String(table.number).padStart(2, "0")}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className={styles.chefCard}>
        <div className={styles.tableHead}>
          <span>Chef Name</span>
          <span>Order Taken</span>
        </div>
        {summary.chefsTable.map((chef) => (
          <div
            key={chef.id}
            className={`${styles.tableRow} ${isDimmed(searchQuery, chef.name, chef.orderTaken) ? styles.dimmed : ""}`}
          >
            <span>{chef.name}</span>
            <strong>{String(chef.orderTaken).padStart(2, "0")}</strong>
          </div>
        ))}
      </article>
    </section>
  );
}
