import React from "react";
import { Link } from "react-router-dom";
import useList from "../store/list";
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
  const { items, completed, fetchActive, addItem, toggle } = useList();
  const [title, setTitle] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [category, setCategory] = React.useState("Other");

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
            {items.map((item) => (
              <li key={item.id} className="list-row">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggle(item.id)}
                    className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#635bff] text-white"
                    title="Mark complete"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#635bff]"></span>
                  </button>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      {item.quantity && <span>{item.quantity}</span>}
                      {item.category && (
                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${categories[item.category as keyof typeof categories] || "bg-slate-500/15 text-slate-600"}`}>
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button className="btn-secondary px-3 py-2 text-sm" onClick={() => toggle(item.id)}>
                  Mark done
                </button>
              </li>
            ))}
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
            {completed.map((item) => (
              <li key={item.id} className="list-row">
                <div className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-emerald-500 text-emerald-500">
                    ✓
                  </span>
                  <div>
                    <p className="font-medium line-through text-slate-500 dark:text-slate-400">
                      {item.title}
                    </p>
                    {item.quantity && (
                      <p className="muted-sm mt-1">{item.quantity}</p>
                    )}
                  </div>
                </div>
                <button className="btn-secondary px-3 py-2 text-sm" onClick={() => toggle(item.id)}>
                  Undo
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {family && <AddItemModal />}
    </div>
  );
}
