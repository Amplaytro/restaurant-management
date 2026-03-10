import { formatCurrency } from "@final-evaluation/shared";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "../api/client.js";
import chefIcon from "../assets/chef-icon.png";
import revenueIcon from "../assets/revenue-icon.png";
import ordersIcon from "../assets/orders-icon.png";
import clientsIcon from "../assets/clients-icon.png";
import pillBg from "../assets/pill-bg.png";
import styles from "./DashboardPage.module.css";

function isDimmed(query, ...values) {
  if (!query) {
    return false;
  }

  const haystack = values.join(" ").toLowerCase();
  return !haystack.includes(query.toLowerCase());
}

function joinSearchValues(...values) {
  return values.flat(Infinity).filter(Boolean).join(" ");
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

const ICON_MAP = {
  accentLight: chefIcon,
  accentBlue: revenueIcon,
  accentMint: ordersIcon,
  accentSky: clientsIcon,
};

function StatCard({ label, value, accent, dimmed }) {
  return (
    <article className={`${styles.statCard} ${dimmed ? styles.dimmed : ""}`}>
      {accent === "accentBlue" ? (
        <div className={styles.layeredIcon}>
          <img src={pillBg} alt="" className={styles.layeredBg} />
          <img src={ICON_MAP[accent]} alt={label} className={styles.layeredFg} />
        </div>
      ) : (
        <img
          className={styles.statIcon}
          src={ICON_MAP[accent]}
          alt={label}
        />
      )}
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
  const orderSummarySearch = joinSearchValues(
    "Order Summary",
    "Served",
    "Dine In",
    "Take Away",
    summary.orderSummary.served,
    summary.orderSummary.dineIn,
    summary.orderSummary.takeaway,
    breakdown.map((item) => `${item.label} ${item.count}`),
  );
  const revenueSearch = joinSearchValues(
    "Revenue",
    "Daily",
    "Weekly",
    "Monthly",
    "Yearly",
    revenue.map((point) => `${point.label} ${point.value}`),
  );
  const tablesSearch = joinSearchValues(
    "Tables",
    "Reserved",
    "Available",
    summary.tablesPreview.map((table) => `Table ${table.number} ${table.capacity} ${table.name}`),
  );
  const visibleTables = Array.from({ length: 30 }, (_, index) => {
    const tableNumber = index + 1;
    const table = summary.tablesPreview.find((entry) => entry.number === tableNumber);

    return (
      table || {
        id: `table-slot-${tableNumber}`,
        number: tableNumber,
        isReserved: false,
      }
    );
  });

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
        <article className={`${styles.panelCard} ${isDimmed(searchQuery, orderSummarySearch) ? styles.dimmed : ""}`}>
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
            <div className={styles.summaryMetric}>
              <strong>{String(summary.orderSummary.served).padStart(2, "0")}</strong>
              <span>Served</span>
            </div>
            <div className={styles.summaryMetric}>
              <strong>{String(summary.orderSummary.dineIn).padStart(2, "0")}</strong>
              <span>Dine In</span>
            </div>
            <div className={styles.summaryMetric}>
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
                    className={styles.breakdownRow}
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

        <article className={`${styles.panelCard} ${isDimmed(searchQuery, revenueSearch) ? styles.dimmed : ""}`}>
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

        <article className={`${styles.tablesPanel} ${isDimmed(searchQuery, tablesSearch) ? styles.dimmed : ""}`}>
          <div className={styles.tablesGraphic} role="img" aria-label="Tables setup">
            <div className={styles.tablesBackground} />
            <div className={styles.tablesDivider} />

            <div className={styles.tablesHeaderBar}>
              <div className={styles.tablesHeaderContent}>
                <h2 className={styles.tablesHeading}>Tables</h2>
                <p className={styles.tablesSubcopy}>Reserved tables remain green while available tables stay white.</p>
              </div>

              <div className={styles.tablesLegend}>
                <span className={styles.tablesLegendItem}>
                  <i className={`${styles.tablesLegendDot} ${styles.tablesLegendDotReserved}`} aria-hidden="true" />
                  Reserved
                </span>
                <span className={styles.tablesLegendItem}>
                  <i className={`${styles.tablesLegendDot} ${styles.tablesLegendDotAvailable}`} aria-hidden="true" />
                  Available
                </span>
              </div>
            </div>

            <div className={styles.tablesBookingGrid}>
              {visibleTables.map((table) => (
                <div
                  key={table.id}
                  className={`${styles.tableBookingCard} ${table.isReserved ? styles.tableBookingReserved : ""}`}
                >
                  <span className={styles.tableBookingLabel}>Table</span>
                  <strong className={styles.tableBookingNumber}>
                    {String(table.number).padStart(2, "0")}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      <article className={styles.chefCard}>
        <div className={styles.tableHead}>
          <span>Chef Name</span>
          <span>Order Taken</span>
        </div>
        {summary.chefsTable.map((chef) => (
          <div key={chef.id} className={styles.tableRow}>
            <span>{chef.name}</span>
            <strong>{String(chef.orderTaken).padStart(2, "0")}</strong>
          </div>
        ))}
      </article>
    </section>
  );
}
