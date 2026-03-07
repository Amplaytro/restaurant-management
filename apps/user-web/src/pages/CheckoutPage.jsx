import { resolveAssetSource } from "@final-evaluation/assets";
import { buildItemCountLabel, formatCurrency } from "@final-evaluation/shared";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { userApi } from "../api/client.js";
import { SwipeAction } from "../components/SwipeAction.jsx";
import { useCart } from "../context/CartContext.jsx";
import styles from "./CheckoutPage.module.css";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cookingInstructions, draft, items, removeItem, totalAmount, updateDraft } = useCart();
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!items.length) {
      return;
    }

    const payload = {
      type: draft.type,
      memberCount: draft.memberCount,
      items: items.map((item) => ({
        menuItemId: item._id,
        quantity: item.quantity,
      })),
    };

    userApi
      .previewOrder(payload)
      .then(setPreview)
      .catch((requestError) => setError(requestError.message));
  }, [draft.memberCount, draft.type, items]);

  if (!items.length) {
    return <Navigate replace to="/" />;
  }

  async function handleSubmitOrder() {
    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      await userApi.createOrder({
        type: draft.type,
        memberCount: draft.type === "dineIn" ? Number(draft.memberCount) : null,
        items: items.map((item) => ({
          menuItemId: item._id,
          quantity: item.quantity,
        })),
        customer: {
          name: draft.name,
          phoneNumber: draft.phoneNumber,
          address: draft.address,
        },
        cookingInstructions,
      });

      navigate("/thank-you");
    } catch (requestError) {
      setError(requestError.message);
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.screen}>
      <header className={styles.header}>
        <button onClick={() => navigate(-1)} type="button">Back</button>
        <h1>Checkout</h1>
      </header>

      <div className={styles.summaryCard}>
        {items.map((item) => (
          <article key={item._id} className={styles.itemRow}>
            <img alt={item.name} src={resolveAssetSource(item.imageSource)} />
            <div className={styles.itemBody}>
              <strong>{item.name}</strong>
              <span>{buildItemCountLabel(item.quantity)} · {formatCurrency(item.price * item.quantity)}</span>
            </div>
            <button onClick={() => removeItem(item._id)} type="button">-</button>
          </article>
        ))}
      </div>

      <div className={styles.modeToggle}>
        <button
          className={draft.type === "dineIn" ? styles.modeActive : ""}
          onClick={() => updateDraft({ type: "dineIn" })}
          type="button"
        >
          Dine In
        </button>
        <button
          className={draft.type === "takeaway" ? styles.modeActive : ""}
          onClick={() => updateDraft({ type: "takeaway" })}
          type="button"
        >
          Takeaway
        </button>
      </div>

      <div className={styles.formBlock}>
        {draft.type === "dineIn" ? (
          <input
            min="1"
            onChange={(event) => updateDraft({ memberCount: Number(event.target.value) })}
            placeholder="Number of members"
            type="number"
            value={draft.memberCount}
          />
        ) : null}

        <input
          onChange={(event) => updateDraft({ name: event.target.value })}
          placeholder="Name"
          value={draft.name}
        />
        <input
          onChange={(event) => updateDraft({ phoneNumber: event.target.value })}
          placeholder="Phone Number"
          value={draft.phoneNumber}
        />

        {draft.type === "takeaway" ? (
          <textarea
            onChange={(event) => updateDraft({ address: event.target.value })}
            placeholder="Complete Address"
            rows="3"
            value={draft.address}
          />
        ) : null}
      </div>

      <Link className={styles.instructionsLink} to="/instructions">
        Add cooking instructions (optional)
        <span>{cookingInstructions ? "Added" : "Tap to add"}</span>
      </Link>

      <div className={styles.previewCard}>
        <strong>{formatCurrency(totalAmount)}</strong>
        {preview ? (
          draft.type === "dineIn" ? (
            <span>
              {preview.waitlist
                ? "All fitting tables are busy. This order will join the wait list."
                : `Table ${String(preview.table.number).padStart(2, "0")} will be reserved for your party.`}
            </span>
          ) : (
            <span>Average delivery time {preview.averageDeliveryTime} mins</span>
          )
        ) : (
          <span>Preparing your order preview…</span>
        )}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.swipeWrap}>
        <SwipeAction
          disabled={
            !draft.name ||
            !draft.phoneNumber ||
            (draft.type === "takeaway" && !draft.address) ||
            submitting
          }
          label={submitting ? "Submitting…" : "Swipe to Order"}
          onComplete={handleSubmitOrder}
        />
      </div>
    </section>
  );
}
