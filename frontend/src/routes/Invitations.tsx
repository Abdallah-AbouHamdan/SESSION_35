import React from "react";
import { useNavigate } from "react-router-dom";
import useInvites from "../store/invites";

export default function Invitations() {
  const { myInvites, fetchMyInvites, accept, dismiss } = useInvites();
  const navigate = useNavigate();
  const [status, setStatus] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchMyInvites();
  }, [fetchMyInvites]);

  const handleAccept = async (token: string) => {
    setIsProcessing(token);
    setStatus(null);
    try {
      await accept(token);
      setStatus("Invitation accepted! You're all set.");
      navigate("/app");
    } catch (error: any) {
      setStatus(error?.message || "Failed to accept invitation.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDismiss = (token: string) => {
    dismiss(token);
    setStatus("Invitation dismissed.");
  };

  return (
    <section className="space-y-6">
      <header className="glass-card text-center">
        <p className="text-sm font-medium text-primary">Invitations</p>
        <h1 className="text-3xl font-semibold mt-2">Join your family shopping group</h1>
        <p className="muted mt-2 max-w-2xl mx-auto">
          Accept an invitation to collaborate with your family. Dismiss an invite to hide it until you receive a new one.
        </p>
      </header>

      {status && (
        <div className="glass-card text-sm text-primary">{status}</div>
      )}

      {myInvites.length === 0 ? (
        <div className="glass-card text-center">
          <h2 className="text-xl font-semibold">No invitations right now</h2>
          <p className="muted mt-2">When someone invites you, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myInvites.map((invite) => (
            <div key={invite.token} className="glass-card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">Invitation from {invite.email || "a family member"}</p>
                <p className="muted text-sm">
                  Expires on {new Date(invite.expiresAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDismiss(invite.token)}
                  className="btn-secondary px-4 py-2"
                  disabled={isProcessing === invite.token}
                >
                  Dismiss
                </button>
                <button
                  onClick={() => handleAccept(invite.token)}
                  className="btn px-4 py-2"
                  disabled={isProcessing === invite.token}
                >
                  {isProcessing === invite.token ? "Joining..." : "Accept"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
