import React from "react";
import useAuth from "../store/auth";
import useFamily from "../store/family";
import useInvites from "../store/invites";

export default function Gate() {
  const { currentUser } = useAuth();
  const { family, createFamily } = useFamily();
  const { fetchMyInvites, myInvites, accept } = useInvites();

  const [familyName, setFamilyName] = React.useState("");
  const [token, setToken] = React.useState("");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    fetchMyInvites();
  }, []);

  async function handleCreate() {
    if (!familyName.trim()) return;
    await createFamily(familyName.trim());
    setMessage("✅ Family created! Invite others from Settings.");
    setFamilyName("");
  }

  async function handleJoin() {
    if (!token.trim()) return;
    await accept(token.trim());
    setMessage("✅ Joined successfully! Let's start planning.");
    setToken("");
  }

  if (!currentUser) {
    return (
      <p className="mt-24 text-center text-lg font-semibold">
        Please sign in to begin.
      </p>
    );
  }

  if (family) {
    return (
      <p className="mt-24 text-center text-lg font-semibold">
        You already belong to {family.name}. Head to the shopping list!
      </p>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="glass-card px-6 py-6 text-center sm:px-10 sm:py-10 md:text-left">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          Welcome, {currentUser.fullName || currentUser.email}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Let's set up your family group
        </h1>
        <p className="muted mt-2 max-w-2xl mx-auto md:mx-0">
          Create a family space or join an existing one to start planning shopping
          trips together.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
        <div className="glass-card flex flex-col gap-4 px-6 py-6 sm:px-8 sm:py-8">
          <h2 className="text-xl font-semibold">Join with an invite token</h2>
          <p className="muted text-sm mt-1">
            Ask a family member to share their invite link or token.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              className="input flex-1 min-w-0"
              placeholder="Enter invite token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <button
              className="btn w-full sm:w-auto sm:flex-none"
              onClick={handleJoin}
            >
              Join Family
            </button>
          </div>
        </div>

        <div className="glass-card flex flex-col gap-4 px-6 py-6 sm:px-8 sm:py-8">
          <h2 className="text-xl font-semibold">Create a new family</h2>
          <p className="muted text-sm mt-1">
            Pick a friendly name. You can invite others once it’s created.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              className="input flex-1 min-w-0"
              placeholder="e.g., The Martinez Crew"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
            />
            <button
              className="btn w-full sm:w-auto sm:flex-none"
              onClick={handleCreate}
            >
              Create Family Group
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card px-6 py-6 sm:px-8 sm:py-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Invitations sent to you</h3>
            <p className="muted text-sm">Tap copy to reuse a token later.</p>
          </div>
          <span className="badge-soft self-start sm:self-auto">
            {myInvites.length} pending
          </span>
        </div>
        {myInvites.length === 0 ? (
          <p className="muted text-sm">
            No invitations yet. Ask a family member to invite you.
          </p>
        ) : (
          <ul className="space-y-3">
            {myInvites.map((i) => (
              <li
                key={i.token}
                className="list-row flex-col items-start gap-2 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-medium text-sm">
                    {i.email || "Family invite"}
                  </p>
                  <p className="muted-sm">
                    Expires {new Date(i.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  className="btn-secondary w-full text-sm sm:w-auto"
                  onClick={() => navigator.clipboard.writeText(i.token)}
                >
                  Copy token
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {message && <p className="text-center text-sm font-medium text-primary">{message}</p>}
    </div>
  );
}
