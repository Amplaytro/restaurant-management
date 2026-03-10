import { useDeferredValue, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import styles from "./AdminShell.module.css";

const navItems = [
  { to: "/", label: "Dashboard", icon: "grid" },
  { to: "/tables", label: "Tables", icon: "seat" },
  { to: "/order-line", label: "Order Line", icon: "receipt" },
  { to: "/menu", label: "Menu", icon: "bars" },
];

const filterSuggestions = [
  "chef",
  "revenue",
  "orders",
  "tables",
  "clients",
  "order summary",
];

const pageTitles = {
  "/": "Dashboard",
  "/tables": "Tables",
  "/order-line": "Order Line",
  "/menu": "Menu",
};

function BrandMark() {
  return (
    <div className={styles.brandMark}>
      <div className={styles.brandCore}>
        <span className={styles.brandDot} />
      </div>
    </div>
  );
}


import navDashboard from "../assets/nav-dashboard.svg";
import navSeat from "../assets/nav-seat.svg";
import navReceipt from "../assets/nav-receipt.svg";
import navBars from "../assets/nav-bars.svg";

function NavIcon({ type }) {
  if (type === "grid") {
    return <img src={navDashboard} alt="Dashboard" className={styles.navIconImg} />;
  }

  if (type === "seat") {
    return <img src={navSeat} alt="Tables" className={styles.navIconImg} />;
  }

  if (type === "receipt") {
    return <img src={navReceipt} alt="Orders" className={styles.navIconImg} />;
  }

  return <img src={navBars} alt="Menu" className={styles.navIconImg} />;
}

export function AdminShell() {
  const [query, setQuery] = useState("");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const location = useLocation();
  const filterRef = useRef(null);
  const isDashboardRoute = location.pathname === "/";
  const isDesktop7MenuRoute = location.pathname === "/menu";
  const pageTitle = pageTitles[location.pathname] ?? "";

  useEffect(() => {
    function handlePointerDown(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    setIsFilterMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isDashboardRoute && query) {
      setQuery("");
    }
  }, [isDashboardRoute, query]);

  if (isDesktop7MenuRoute) {
    return (
      <div className={styles.desktop7Shell}>
        <Outlet
          context={{
            searchQuery: "",
            pathname: location.pathname,
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <BrandMark />
      
      <header className={styles.header}>
        {isDashboardRoute ? (
          <div className={styles.searchWrap} ref={filterRef}>
            <div className={styles.searchShell}>
              <div className={styles.logo}>
                <span>F</span>
              </div>
              <input
                aria-label="Filter"
                className={styles.searchInput}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setIsFilterMenuOpen(true)}
                placeholder="Filter..."
                value={query}
              />
              <button
                aria-expanded={isFilterMenuOpen}
                aria-haspopup="listbox"
                aria-label="Open filter suggestions"
                className={styles.searchArrow}
                onClick={() => setIsFilterMenuOpen((current) => !current)}
                type="button"
              >
                <span />
              </button>
            </div>
            {isFilterMenuOpen ? (
              <div className={styles.filterMenu} role="listbox" aria-label="Filter suggestions">
                {filterSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    className={styles.filterOption}
                    onClick={() => {
                      setQuery(suggestion);
                      setIsFilterMenuOpen(false);
                    }}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
                <button
                  className={styles.filterOptionMuted}
                  onClick={() => {
                    setQuery("");
                    setIsFilterMenuOpen(false);
                  }}
                  type="button"
                >
                  Clear filter
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
        )}
      </header>

      <aside className={styles.sidebar}>
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

      <main className={styles.panel}>
        <Outlet
          context={{
            searchQuery: isDashboardRoute ? deferredQuery : "",
            pathname: location.pathname,
          }}
        />
      </main>
    </div>
  );
}
