import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import useInvites from "../store/invites";

export default function InviteAccept() {
  const { token } = useParams();
  const { accept } = useInvites();
  const navigate = useNavigate();
  const [status, setStatus] = React.useState("Joining family...");

  React.useEffect(() => {
    if (token) {
      accept(token)
        .then(() => setStatus("✅ Joined family successfully!"))
        .catch((err) => setStatus("❌ Error: " + err.message));
    } else {
      setStatus("❌ Invite token missing");
    }
  }, [token, accept]);

  const success = status.startsWith("✅");

  return (
    <section className="auth-gradient">
      <div className="glass-card w-full max-w-lg p-10 text-center">
        <div className="flex flex-col items-center gap-4 mb-6">
          <span className="auth-icon">
            <Sparkles size={26} />
          </span>
          <h1 className="text-3xl font-semibold">Processing invitation</h1>
          <p className="muted text-sm">We’re verifying your invite and setting things up.</p>
        </div>

        <p className={success ? "text-emerald-500" : "text-red-500"}>{status}</p>

        {success && (
          <button className="btn mt-6" onClick={() => navigate("/app")}>
            Open your shopping list
          </button>
        )}
      </div>
    </section>
  );
}
