import React from "react";
import { Link } from "react-router-dom";
import useList, { type Item } from "../store/list";
import AddItemModal from "../components/AddItemModal";
import useFamily from "../store/family";

const categories = {
  Produce: "bg-emerald-500/15 text-emerald-600",
  Dairy: "bg-sky-500/15 text-sky-600",
  Meat: "bg-rose-500/15 text-rose-600",
  Pantry: "bg-amber-500/15 text-amber-600",
  Household: "bg-cyan-500/15 text-cyan-600",
  Other: "bg-slate-500/15 text-slate-600",
} as const;

export default function List() {
  const { items, completed, fetchActive, addItem, toggle, updateItem, remove } = useList();
  const [title, setTitle] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [category, setCategory] = React.useState("Other");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editQuantity, setEditQuantity] = React.useState("");
  const [editCategory, setEditCategory] = React.useState("Other");

  const { family, getMine } = useFamily();
  React.useEffect(() => {
    getMine();
  }, []);

  React.useEffect(() => {
    if (family) {
      fetchActive();
    } else {
      // clear list when user leaves family
      setTitle("");
      setQuantity("");
    }
  }, [family]);

  const pendingCount = items.length;
  const completedCount = completed.length;
  const total = pendingCount + completedCount;

  async function handleAdd() {
    if (!family) return;
    if (!title.trim()) return;
    await addItem({ title: title.trim(), quantity: quantity.trim(), category });
    setTitle("");
    setQuantity("");
    setCategory("Other");
  }

  React.useEffect(() => {
    if (editingId) {
      const current = [...items, ...completed].find((i) => i.id === editingId);
      if (!current) {
        setEditingId(null);
        setEditTitle("");
        setEditQuantity("");
        setEditCategory("Other");
      }
    }
  }, [items, completed, editingId]);

  if (!family) {
    return (
      <div className="glass-card text-center">
        <h1 className="text-3xl font-semibold">Welcome to FamilyCart</h1>
        <p className="muted mt-2">Create or join a family group to start planning your shopping together.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/gate" className="btn">Create family</Link>
          <Link to="/gate" className="btn-secondary">Join with token</Link>
        </div>
      </div>
    );
  }

  function startEditing(item: Item) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditQuantity(item.quantity || "");
    setEditCategory(
      item.category && Object.keys(categories).includes(item.category)
        ? item.category
        : "Other"
    );
  }

  async function handleSaveEdit(id: string) {
    if (!editTitle.trim()) return;
    await updateItem(id, {
      title: editTitle.trim(),
      quantity: editQuantity.trim(),
      category: editCategory,
    });
    setEditingId(null);
    setEditTitle("");
    setEditQuantity("");
    setEditCategory("Other");
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Remove this item from the list?");
    if (!confirmed) return;
    await remove(id);
    if (editingId === id) {
      setEditingId(null);
      setEditTitle("");
      setEditQuantity("");
      setEditCategory("Other");
    }
  }

  function renderRow(item: Item, status: "pending" | "completed") {
    const isEditing = editingId === item.id;
    return (
      <li
        key={item.id}
        className="list-row flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        {isEditing ? (
          <div className="w-full space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                className="input flex-1"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Item name"
              />
              <input
                className="input sm:w-32"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                placeholder="Qty"
              />
              <select
                className="input sm:w-40"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
              >
                {Object.keys(categories).map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn"
                onClick={() => handleSaveEdit(item.id)}
              >
                Save changes
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setEditTitle("");
                  setEditQuantity("");
                  setEditCategory("Other");
                }}
              >
                Cancel
              </button>
              <button
                className="btn-secondary text-red-600 dark:text-red-400"
                onClick={() => handleDelete(item.id)}
              >
                Delete item
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => toggle(item.id)}
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  status === "pending"
                    ? "border-[#635bff]"
                    : "border-emerald-500 text-emerald-500"
                }`}
                title={status === "pending" ? "Mark complete" : "Mark pending"}
              >
                {status === "pending" ? (
                  <span className="h-2 w-2 rounded-full bg-[#635bff]"></span>
                ) : (
                  "✓"
                )}
              </button>
              <div>
                <p
                  className={`font-medium ${
                    status === "completed"
                      ? "line-through text-slate-500 dark:text-slate-400"
                      : ""
                  }`}
                >
                  {item.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  {item.quantity && <span>{item.quantity}</span>}
                  {item.category && (
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                        categories[item.category as keyof typeof categories] ||
                        "bg-slate-500/15 text-slate-600"
                      }`}
                    >
                      {item.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button
                className="btn-secondary px-3 py-2 text-sm"
                onClick={() => toggle(item.id)}
              >
                {status === "pending" ? "Mark done" : "Undo"}
              </button>
              <button
                className="btn-secondary px-3 py-2 text-sm"
                onClick={() => startEditing(item)}
              >
                Edit
              </button>
              <button
                className="btn-secondary px-3 py-2 text-sm text-red-600 dark:text-red-400"
                onClick={() => handleDelete(item.id)}
              >
                Delete
              </button>
            </div>
          </>
        )}
      </li>
    );
  }

  return (
    <div className="space-y-8">
      <div className="glass-card">
        <p className="text-sm font-medium text-primary">Shopping list overview</p>
        <div className="mt-3 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Plan the week with your family</h1>
            <p className="muted mt-2 max-w-xl">
              Add items, assign quantities, and track what’s completed in real-time.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="stat-pill text-center">
              <p className="text-xs uppercase tracking-wide text-muted">Pending</p>
              <p className="text-xl font-semibold">{pendingCount}</p>
            </div>
            <div className="stat-pill text-center">
              <p className="text-xs uppercase tracking-wide text-muted">Completed</p>
              <p className="text-xl font-semibold">{completedCount}</p>
            </div>
            <div className="stat-pill text-center">
              <p className="text-xs uppercase tracking-wide text-muted">Total</p>
              <p className="text-xl font-semibold">{total}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <input
            className="input"
            placeholder="Add a new item (e.g., Organic Bananas)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="input sm:w-32"
            placeholder="Qty"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {Object.keys(categories).map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <button className="btn" onClick={handleAdd}>
            Add Item
          </button>
        </div>
      </div>

      <section className="glass-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Shopping list</h2>
          <span className="badge-soft">{pendingCount} item{pendingCount === 1 ? "" : "s"}</span>
        </div>

        {pendingCount === 0 ? (
          <p className="muted text-sm">No items pending. Add something to get started.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => renderRow(item, "pending"))}
          </ul>
        )}
      </section>

      <section className="glass-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Completed</h2>
          <span className="badge-soft">{completedCount}</span>
        </div>

        {completedCount === 0 ? (
          <p className="muted text-sm">No completed items yet.</p>
        ) : (
          <ul className="space-y-3">
            {completed.map((item) => renderRow(item, "completed"))}
          </ul>
        )}
      </section>
      {family && <AddItemModal />}
    </div>
  );
}
