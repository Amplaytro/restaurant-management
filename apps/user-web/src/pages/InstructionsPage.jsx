import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import styles from "./InstructionsPage.module.css";

const suggestions = [
  "Extra cheese",
  "Less spice",
  "No onions",
  "Cut into squares",
  "Add chilli flakes",
];

export function InstructionsPage() {
  const navigate = useNavigate();
  const { cookingInstructions, setCookingInstructions } = useCart();

  return (
    <section className={styles.screen}>
      <h1>Add Cooking Instructions</h1>
      <p>
        The restaurant will try its best to follow your request. However, refunds or
        cancellations in this regard won’t be possible.
      </p>

      <textarea
        onChange={(event) => setCookingInstructions(event.target.value)}
        placeholder="Type your request here"
        rows="6"
        value={cookingInstructions}
      />

      <div className={styles.suggestions}>
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setCookingInstructions(suggestion)}
            type="button"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className={styles.actions}>
        <button onClick={() => navigate("/checkout")} type="button">
          Cancel
        </button>
        <button onClick={() => navigate("/checkout")} type="button">
          Next
        </button>
      </div>
    </section>
  );
}
