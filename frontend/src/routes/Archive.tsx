import React from "react";
import useList from "../store/list";
import useFamily from "../store/family";

export default function Archive() {
  const archives = useList((state) => state.archives);
  const fetchArchives = useList((state) => state.fetchArchives);
  const family = useFamily((state) => state.family);

  React.useEffect(() => {
    if (family) {
      fetchArchives();
    }
  }, [family, fetchArchives]);

  if (!family) {
    return (
      <section className="glass-card text-center">
        <h2 className="text-2xl font-semibold">No family yet</h2>
        <p className="muted mt-2">Create or join a family group to start archiving weekly lists.</p>
      </section>
    );
  }

  if (archives.length === 0) {
    return (
      <section className="glass-card text-center">
        <h2 className="text-2xl font-semibold">No archived lists yet</h2>
        <p className="muted mt-2">
          When you run a weekly reset we’ll store the completed list here for reference.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="glass-card text-center">
        <p className="text-sm font-medium text-primary">Archive</p>
        <h1 className="text-3xl font-semibold mt-2">Past shopping lists</h1>
        <p className="muted mt-2">Review what was completed each week and what still needs attention.</p>
      </header>

      <div className="space-y-6">
        {archives.map((list) => {
          const archivedLabel = list.archivedAt
            ? new Date(list.archivedAt).toLocaleDateString()
            : new Date(list.weekStart).toLocaleDateString();
          const completed = list.items.filter((item) => item.status === "done");
          const pending = list.items.filter((item) => item.status !== "done");

          return (
            <div key={list.id} className="glass-card space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Week of {new Date(list.weekStart).toLocaleDateString()}</h2>
                  <p className="muted text-sm">Archived on {archivedLabel}</p>
                </div>
                <div className="stat-pill text-center">
                  <p className="text-xs uppercase tracking-wide text-muted">Items</p>
                  <p className="text-xl font-semibold">{list.items.length}</p>
                </div>
              </div>

              {list.items.length === 0 ? (
                <p className="muted text-sm">No items were added to this list.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <section>
                    <h3 className="text-sm font-semibold mb-2">Completed ({completed.length})</h3>
                    <div className="space-y-2">
                      {completed.length === 0 && <p className="muted-sm">Nothing was marked done.</p>}
                      {completed.map((item) => (
                        <div key={item.id} className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 dark:border-emerald-500/30 dark:bg-emerald-900/30">
                          <p className="font-medium">{item.title}</p>
                          <p className="muted-sm">
                            {item.quantity ? `${item.quantity} • ` : ""}{item.category || "General"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold mb-2">Pending ({pending.length})</h3>
                    <div className="space-y-2">
                      {pending.length === 0 && <p className="muted-sm">Everything was completed 🎉</p>}
                      {pending.map((item) => (
                        <div key={item.id} className="rounded-xl border border-amber-200/70 bg-amber-50/70 px-3 py-2 dark:border-amber-500/30 dark:bg-amber-900/30">
                          <p className="font-medium">{item.title}</p>
                          <p className="muted-sm">
                            {item.quantity ? `${item.quantity} • ` : ""}{item.category || "General"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
