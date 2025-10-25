import React from "react";
import useList from "../store/list";

export default function AddItemModal() {
  const { addItem } = useList();
  const [show, setShow] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [category, setCategory] = React.useState("Other");

  async function handleAdd() {
    if (!title.trim()) return;
    await addItem({ title, quantity, category });
    setShow(false);
    setTitle("");
    setQuantity("");
    setCategory("Other");
  }

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="btn fixed bottom-6 right-6 shadow-lg shadow-[#635bff]/40"
      >
        + Add Item
      </button>

      {show && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Add item</h3>
                <p className="muted text-sm">Add a new item to your family’s list.</p>
              </div>
              <button className="btn-ghost" onClick={() => setShow(false)}>
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="label">Item name</label>
                <input
                  className="input"
                  placeholder="e.g., Organic Bananas"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Quantity</label>
                  <input
                    className="input"
                    placeholder="e.g., 6 or 2 lbs"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select
                    className="input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option>Produce</option>
                    <option>Dairy</option>
                    <option>Meat</option>
                    <option>Pantry</option>
                    <option>Household</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button className="btn-secondary" onClick={() => setShow(false)}>
                  Cancel
                </button>
                <button className="btn" onClick={handleAdd}>
                  Add item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
