import { resolveAssetSource } from "@final-evaluation/assets";
import { buildItemCountLabel, formatCurrency } from "@final-evaluation/shared";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "../api/client.js";
import { SwipeAction } from "../components/SwipeAction.jsx";
import { useCart } from "../context/CartContext.jsx";
import styles from "./HomePage.module.css";

function CategoryIcon({ slug }) {
  return <span className={`${styles.categoryGlyph} ${styles[slug] || ""}`} />;
}

export function HomePage() {
  const navigate = useNavigate();
  const { addItem, itemCount, items, removeItem, totalAmount } = useCart();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [itemsResponse, setItemsResponse] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sentinelRef = useRef(null);

  useEffect(() => {
    userApi
      .getCategories()
      .then(setCategories)
      .catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    userApi
      .getMenuItems({
        category: selectedCategory,
        search,
        page,
        limit: 4,
      })
      .then((response) => {
        setItemsResponse((current) => {
          if (page === 1) {
            return response.items;
          }

          const seen = new Set(current.map((item) => item._id));
          const merged = [...current];

          for (const item of response.items) {
            if (!seen.has(item._id)) {
              seen.add(item._id);
              merged.push(item);
            }
          }

          return merged;
        });
        setHasMore(response.hasMore);
        setLoading(false);
      })
      .catch((requestError) => {
        setError(requestError.message);
        setLoading(false);
      });
  }, [page, search, selectedCategory]);

  useEffect(() => {
    if (!sentinelRef.current) {
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && hasMore && !loading && itemsResponse.length > 0) {
        setPage((current) => current + 1);
      }
    });

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, itemsResponse.length, loading]);

  function quantityFor(itemId) {
    return items.find((entry) => entry._id === itemId)?.quantity || 0;
  }

  function changeCategory(nextCategory) {
    setLoading(true);
    setSelectedCategory(nextCategory);
    setPage(1);
    setItemsResponse([]);
    setHasMore(true);
  }

  function changeSearch(nextSearch) {
    setLoading(true);
    setSearch(nextSearch);
    setPage(1);
    setItemsResponse([]);
    setHasMore(true);
  }

  return (
    <section className={styles.screen}>
      <header className={styles.header}>
        <p>Good evening</p>
        <h1>Place your order here</h1>
      </header>

      <label className={styles.searchBox}>
        <span className={styles.searchIcon} />
        <input
          onChange={(event) => changeSearch(event.target.value)}
          placeholder="Search"
          value={search}
        />
      </label>

      <div className={styles.categories}>
        <button
          className={`${styles.categoryChip} ${selectedCategory === "" ? styles.categoryChipActive : ""}`}
          onClick={() => changeCategory("")}
          type="button"
        >
          <span className={styles.categoryGlyph} />
          <span>All</span>
        </button>
        {categories.map((category) => (
          <button
            key={category._id}
            className={`${styles.categoryChip} ${selectedCategory === category.slug ? styles.categoryChipActive : ""}`}
            onClick={() => changeCategory(category.slug)}
            type="button"
          >
            <CategoryIcon slug={category.slug} />
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      <h2 className={styles.sectionTitle}>{selectedCategory || "All"} menu</h2>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.grid}>
        {itemsResponse.map((item) => {
          const quantity = quantityFor(item._id);
          return (
            <article key={item._id} className={styles.card}>
              <div className={styles.cardImageWrap}>
                <img alt={item.name} src={resolveAssetSource(item.imageSource)} />
              </div>
              <strong>{item.name}</strong>
              <span>{formatCurrency(item.price)}</span>
              {quantity ? (
                <div className={styles.stepper}>
                  <button onClick={() => removeItem(item._id)} type="button">-</button>
                  <em>{quantity}</em>
                  <button onClick={() => addItem(item)} type="button">+</button>
                </div>
              ) : (
                <button className={styles.addButton} onClick={() => addItem(item)} type="button">
                  +
                </button>
              )}
            </article>
          );
        })}
      </div>

      {loading ? <p className={styles.loading}>Loading…</p> : null}
      <div ref={sentinelRef} />

      <div className={styles.checkoutDock}>
        <div className={styles.cartMeta}>
          <span>{buildItemCountLabel(itemCount)}</span>
          <strong>{formatCurrency(totalAmount)}</strong>
        </div>
        <SwipeAction
          disabled={!itemCount}
          label={itemCount ? "Swipe to Checkout" : "Add items to continue"}
          onComplete={() => navigate("/checkout")}
        />
      </div>
    </section>
  );
}
