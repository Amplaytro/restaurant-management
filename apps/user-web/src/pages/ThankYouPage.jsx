import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import styles from "./ThankYouPage.module.css";

export function ThankYouPage() {
  const navigate = useNavigate();
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    const timer = window.setTimeout(() => navigate("/"), 2000);
    return () => window.clearTimeout(timer);
  }, [clearCart, navigate]);

  return (
    <section className={styles.screen}>
      <div className={styles.content}>
        <h1>Thank you</h1>
        <p>Your order has been sent to the restaurant.</p>
      </div>
    </section>
  );
}
