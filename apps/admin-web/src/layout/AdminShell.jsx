import { useDeferredValue, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import styles from "./AdminShell.module.css";

const navItems = [
  { to: "/", label: "Dashboard", icon: "grid" },
  { to: "/tables", label: "Tables", icon: "seat" },
  { to: "/order-line", label: "Order Line", icon: "receipt" },
  { to: "/menu", label: "Menu", icon: "bars" },
];

function BrandMark() {
  return (
    <div className={styles.brandMark}>
      <div className={styles.brandCore}>
        <span className={styles.brandDot} />
      </div>
    </div>
  );
}

function NavIcon({ type }) {
  if (type === "grid") {
    return (
      <span className={styles.iconGrid}>
        <i />
        <i />
        <i />
        <i />
      </span>
    );
  }

  if (type === "seat") {
    return (
      <span className={styles.iconSeat}>
        <i />
        <i />
      </span>
    );
  }

  if (type === "receipt") {
    return (
      <span className={styles.iconReceipt}>
        <i />
        <i />
        <i />
      </span>
    );
  }

  return (
    <span className={styles.iconBars}>
      <i />
      <i />
      <i />
    </span>
  );
}

export function AdminShell() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const location = useLocation();

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <BrandMark />
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
              }
              end={item.to === "/"}
              to={item.to}
            >
              <NavIcon type={item.icon} />
            </NavLink>
          ))}
        </nav>
        <button className={styles.settingsButton} type="button" aria-label="Settings">
          <span className={styles.settingsRing} />
        </button>
      </aside>

      <div className={styles.contentArea}>
        <header className={styles.header}>
          <div className={styles.searchShell}>
            <div className={styles.logo}>
              <span>F</span>
            </div>
            <input
              aria-label="Filter"
              className={styles.searchInput}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter..."
              value={query}
            />
            <div className={styles.searchArrow}>
              <span />
            </div>
          </div>
        </header>

        <main className={styles.panel}>
          <Outlet context={{ searchQuery: deferredQuery, pathname: location.pathname }} />
        </main>
      </div>
    </div>
  );
}
