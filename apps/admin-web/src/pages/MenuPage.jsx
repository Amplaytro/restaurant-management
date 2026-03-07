import { resolveAssetSource } from "@final-evaluation/assets";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "../api/client.js";
import styles from "./MenuPage.module.css";

const initialForm = {
  name: "",
  description: "",
  price: "",
  averagePreparationTime: "",
  category: "",
  stock: "",
};

function matchesSearch(query, item) {
  if (!query) {
    return true;
  }

  return `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase());
}

export function MenuPage() {
  const { searchQuery } = useOutletContext();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [categoryResponse, itemResponse] = await Promise.all([
        adminApi.getCategories(),
        adminApi.getMenuItems({ limit: 32 }),
      ]);

      setCategories(categoryResponse);
      setItems(itemResponse.items);
      setForm((current) => ({
        ...current,
        category: current.category || categoryResponse[0]?.slug || "",
      }));
      setLoading(false);
    } catch (requestError) {
      setError(requestError.message);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const previewUrl = useMemo(() => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile);
    }

    if (editingId) {
      const editingItem = items.find((item) => item._id === editingId);
      return resolveAssetSource(editingItem?.imageSource);
    }

    return "";
  }, [editingId, items, selectedFile]);

  useEffect(
    () => () => {
      if (selectedFile && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl, selectedFile],
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (selectedFile) {
        payload.append("image", selectedFile);
      }

      await adminApi.saveMenuItem(payload, editingId || undefined);
      setForm({ ...initialForm, category: categories[0]?.slug || "" });
      setSelectedFile(null);
      setEditingId("");
      setError("");
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function startEdit(item) {
    const category = categories.find((entry) => entry._id === item.categoryId);
    setEditingId(item._id);
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      averagePreparationTime: String(item.averagePreparationTime),
      category: category?.slug || categories[0]?.slug || "",
      stock: String(item.stock),
    });
    setSelectedFile(null);
  }

  async function handleDelete(itemId) {
    try {
      await adminApi.deleteMenuItem(itemId);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  if (loading) {
    return <p className={styles.loading}>Loading menu…</p>;
  }

  return (
    <section className={styles.page}>
      <div className={styles.formCard}>
        <div className={styles.uploadPreview}>
          {previewUrl ? <img alt="Preview" src={previewUrl} /> : <span>Drop image here</span>}
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input name="name" onChange={handleChange} placeholder="Name" value={form.name} />
          <textarea
            name="description"
            onChange={handleChange}
            placeholder="Description"
            rows="4"
            value={form.description}
          />
          <input name="price" onChange={handleChange} placeholder="Price" type="number" value={form.price} />
          <input
            name="averagePreparationTime"
            onChange={handleChange}
            placeholder="Average prep time"
            type="number"
            value={form.averagePreparationTime}
          />
          <select name="category" onChange={handleChange} value={form.category}>
            {categories.map((category) => (
              <option key={category._id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <input name="stock" onChange={handleChange} placeholder="Stock" type="number" value={form.stock} />
          <input accept="image/*" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} type="file" />
          <button type="submit">{editingId ? "Update Item" : "Save Item"}</button>
        </form>
        {error ? <p className={styles.error}>{error}</p> : null}
      </div>

      <div className={styles.listCard}>
        <header className={styles.listHeader}>
          <h1>Foodies Menu</h1>
          <p>{items.length} active dishes</p>
        </header>
        <div className={styles.list}>
          {items.map((item) => (
            <article
              key={item._id}
              className={`${styles.menuItem} ${!matchesSearch(searchQuery, item) ? styles.dimmed : ""}`}
            >
              <img alt={item.name} src={resolveAssetSource(item.imageSource)} />
              <div className={styles.menuBody}>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
                <span>
                  ₹{item.price} · {item.averagePreparationTime} min · stock {item.stock}
                </span>
              </div>
              <div className={styles.menuActions}>
                <button onClick={() => startEdit(item)} type="button">
                  Edit
                </button>
                <button onClick={() => handleDelete(item._id)} type="button">
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
