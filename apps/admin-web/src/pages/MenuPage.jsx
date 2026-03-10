import { resolveAssetSource } from "@final-evaluation/assets";
import { formatCurrency } from "@final-evaluation/shared";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { adminApi } from "../api/client.js";
import desktop7MenuSvg from "../assets/desktop7-menu.svg";
import menuImageIcon from "../assets/menu-image-icon.svg";
import navDashboard from "../assets/nav-dashboard.svg";
import navSeat from "../assets/nav-seat.svg";
import navReceipt from "../assets/nav-receipt.svg";
import navBars from "../assets/nav-bars.svg";
import styles from "./MenuPage.module.css";
import shellStyles from "../layout/AdminShell.module.css";

const initialFormState = {
  name: "",
  description: "",
  prepTime: "",
  price: "",
};

function MenuCard({ item }) {
  return (
    <article className={`${styles.menuCard} ${!item.isActive ? styles.menuCardInactive : ""}`}>
      <div className={styles.menuCardImageWrap}>
        {item.imageSource ? (
          <img
            alt={item.name}
            className={styles.menuCardImage}
            src={resolveAssetSource(item.imageSource)}
          />
        ) : (
          <img alt="" aria-hidden="true" className={styles.menuCardFallbackIcon} src={menuImageIcon} />
        )}
      </div>

      <div className={styles.menuCardBody}>
        <div className={styles.menuCardTitleRow}>
          <h3 className={styles.menuCardTitle}>{item.name}</h3>
          {!item.isActive ? <span className={styles.menuCardStatus}>Inactive</span> : null}
        </div>
        <p className={styles.menuCardDescription}>{item.description}</p>
        <div className={styles.menuCardMeta}>
          <span>{formatCurrency(item.price)}</span>
          <span>{item.averagePreparationTime} min</span>
        </div>
      </div>
    </article>
  );
}

export function MenuPage() {
  const [menuItem, setMenuItem] = useState(initialFormState);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [desktopScale, setDesktopScale] = useState(1);
  const desktopPanelScale = desktopScale > 1 ? 1 / desktopScale : 1;

  useEffect(() => {
    function syncDesktopScale() {
      if (window.innerWidth <= 1100) {
        setDesktopScale(1);
        return;
      }

      const nextScale = window.innerWidth / 1440;
      setDesktopScale(nextScale);
    }

    syncDesktopScale();
    window.addEventListener("resize", syncDesktopScale);

    return () => window.removeEventListener("resize", syncDesktopScale);
  }, []);

  useEffect(() => {
    if (!selectedImage) {
      setImagePreviewUrl("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedImage);
    setImagePreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedImage]);

  async function loadMenuItems() {
    try {
      setIsLoading(true);
      const payload = await adminApi.getMenuItems({ limit: 100, includeInactive: true });
      setMenuItems(payload.items);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMenuItems();
  }, []);

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setMenuItem((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleImageChange(event) {
    setSelectedImage(event.target.files?.[0] ?? null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setIsSaving(true);
      const payload = new FormData();
      payload.append("name", menuItem.name.trim());
      payload.append("description", menuItem.description.trim());
      payload.append("price", menuItem.price.trim());
      payload.append("averagePreparationTime", menuItem.prepTime.trim());

      if (selectedImage) {
        payload.append("image", selectedImage);
      }

      await adminApi.saveMenuItem(payload);

      setMenuItem(initialFormState);
      setSelectedImage(null);
      setError("");
      await loadMenuItems();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.desktop7Page}>
      <div
        className={styles.desktop7Stage}
        style={{
          "--desktop-scale": String(desktopScale),
          "--desktop-panel-scale": String(desktopPanelScale),
        }}
      >
        <div className={styles.desktop7Canvas}>
          <img className={styles.desktop7Image} alt="Menu page (Desktop7)" src={desktop7MenuSvg} />

          <form className={styles.formOverlay} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label className={styles.imageField} htmlFor="menu-image">
                <input
                  accept="image/*"
                  className={styles.imageInput}
                  id="menu-image"
                  name="image"
                  onChange={handleImageChange}
                  type="file"
                />
                {imagePreviewUrl ? (
                  <img alt="Selected menu item preview" className={styles.imagePreview} src={imagePreviewUrl} />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <img alt="" aria-hidden="true" className={styles.imagePlaceholderIcon} src={menuImageIcon} />
                  </div>
                )}
              </label>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="menu-name">
                name
              </label>
              <input
                className={styles.fieldInput}
                id="menu-name"
                name="name"
                onChange={handleFieldChange}
                placeholder="name"
                required
                type="text"
                value={menuItem.name}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="menu-description">
                description
              </label>
              <input
                className={styles.fieldInput}
                id="menu-description"
                name="description"
                onChange={handleFieldChange}
                placeholder="description"
                required
                type="text"
                value={menuItem.description}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="menu-price">
                price
              </label>
              <input
                className={styles.fieldInput}
                id="menu-price"
                inputMode="decimal"
                name="price"
                onChange={handleFieldChange}
                placeholder="price"
                required
                type="text"
                value={menuItem.price}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="menu-prep-time">
                average prep time
              </label>
              <input
                className={styles.fieldInput}
                id="menu-prep-time"
                inputMode="numeric"
                name="prepTime"
                onChange={handleFieldChange}
                placeholder="time in minutes"
                required
                type="text"
                value={menuItem.prepTime}
              />
            </div>

            {error ? <p className={styles.errorMessage}>{error}</p> : null}

            <button className={styles.submitButton} disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : "Add New Dish"}
            </button>
          </form>

          <aside className={styles.menuPanel}>
            <div className={styles.menuPanelInner}>
              {isLoading ? (
                <p className={styles.panelStatus}>Loading menu items...</p>
              ) : menuItems.length ? (
                <div className={styles.menuList}>
                  {menuItems.map((item) => (
                    <MenuCard key={item._id} item={item} />
                  ))}
                </div>
              ) : (
                <p className={styles.panelStatus}>No menu items available.</p>
              )}
            </div>
          </aside>

          <nav className={styles.navOverlay} aria-label="Primary">
            <div className={styles.menuSidebarWrap}>
              <aside className={shellStyles.sidebar}>
                <nav className={shellStyles.nav}>
                  <NavLink
                    className={({ isActive }) =>
                      `${shellStyles.navItem} ${isActive ? shellStyles.navItemActive : ""}`
                    }
                    to="/"
                    aria-label="Dashboard"
                    end
                  >
                    <img src={navDashboard} alt="" className={shellStyles.navIconImg} />
                  </NavLink>
                  <NavLink
                    className={({ isActive }) =>
                      `${shellStyles.navItem} ${isActive ? shellStyles.navItemActive : ""}`
                    }
                    to="/tables"
                    aria-label="Tables"
                  >
                    <img src={navSeat} alt="" className={shellStyles.navIconImg} />
                  </NavLink>
                  <NavLink
                    className={({ isActive }) =>
                      `${shellStyles.navItem} ${isActive ? shellStyles.navItemActive : ""}`
                    }
                    to="/order-line"
                    aria-label="Order Line"
                  >
                    <img src={navReceipt} alt="" className={shellStyles.navIconImg} />
                  </NavLink>
                  <NavLink
                    className={({ isActive }) =>
                      `${shellStyles.navItem} ${isActive ? shellStyles.navItemActive : ""}`
                    }
                    to="/menu"
                    aria-label="Menu"
                  >
                    <img src={navBars} alt="" className={shellStyles.navIconImg} />
                  </NavLink>
                </nav>
                <button className={shellStyles.settingsButton} type="button" aria-label="Settings">
                  <span className={shellStyles.settingsRing} />
                </button>
              </aside>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
