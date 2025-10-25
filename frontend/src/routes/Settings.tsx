import React from "react";
import useFamily from "../store/family";
import useInvites from "../store/invites";

export default function Settings() {
  const { family, members, getMine, leave } = useFamily();
  const { generate } = useInvites();
  const [generatedInvite, setGeneratedInvite] = React.useState<{ invite: { token: string; expiresAt: string; email?: string }; link: string } | null>(null);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteStatus, setInviteStatus] = React.useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = React.useState(false);
  const createdAt = family && (family as any).createdAt ? new Date((family as any).createdAt).toLocaleDateString() : null;

  React.useEffect(() => {
    getMine();
  }, []);

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      setInviteStatus("Please enter an email address.");
      return;
    }
    setInviteLoading(true);
    setInviteStatus(null);
    try {
      const result = await generate(inviteEmail.trim());
      setGeneratedInvite(result);
      setInviteStatus(`Invitation sent to ${inviteEmail.trim()}. Share the link below.`);
      setInviteEmail("");
    } catch (error: any) {
      setInviteStatus(error?.message || "Unable to generate invite.");
    } finally {
      setInviteLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="glass-card">
        <p className="text-sm font-medium text-primary">Family settings</p>
        <h1 className="mt-2 text-3xl font-semibold">Manage your family group</h1>
        <p className="muted mt-2 max-w-3xl">
          Update family details, share invitations, and manage membership from one place.
        </p>
      </div>

      <div className="glass-card space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Family information</h2>
            <p className="muted text-sm">Your family group details</p>
          </div>
          {createdAt && <span className="badge-soft">Created {createdAt}</span>}
        </div>

        {family ? (
          <>
            <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-sm font-medium muted">Family name</p>
              <p className="text-lg font-semibold mt-1">{family.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium muted uppercase tracking-wide">Members</h3>
              <div className="mt-3 grid gap-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="list-row flex-col items-start gap-2 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-medium">{member.full_name || member.email}</p>
                      <p className="muted-sm">{member.email}</p>
                    </div>
                    <span className="badge-soft">{member.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="muted text-sm">No family created yet.</p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass-card">
          <h2 className="text-xl font-semibold">Invite new members</h2>
          <p className="muted text-sm mt-1">
            Send an invitation email or generate a token to share manually.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="label" htmlFor="invite-email">Invitee email (optional)</label>
              <input
                id="invite-email"
                type="email"
                className="input"
                placeholder="member@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                className="btn w-full"
                onClick={() => handleInvite(inviteEmail)}
                disabled={inviteLoading}
              >
                {inviteLoading ? "Sending..." : "Send invitation"}
              </button>
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={() => handleInvite(undefined)}
                disabled={inviteLoading}
              >
                {inviteLoading ? "Generating..." : "Generate token only"}
              </button>
            </div>
            {inviteStatus && (
              <p className="muted text-sm text-left">{inviteStatus}</p>
            )}
          </div>
          {generatedInvite && (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-[#635bff]/30 bg-[#635bff]/5 p-3 text-sm">
                <p className="font-medium">Invite token {generatedInvite.invite.email ? "for " + generatedInvite.invite.email : ""}</p>
                <p className="mt-1 break-all font-mono text-xs">{generatedInvite.invite.token}</p>
                <button
                  className="btn-ghost mt-2"
                  onClick={() => navigator.clipboard.writeText(generatedInvite.invite.token)}
                >
                  Copy token
                </button>
              </div>
              <div className="rounded-xl border border-[#635bff]/30 bg-white/70 p-3 text-sm dark:bg-slate-900/60">
                <p className="font-medium">Shareable link</p>
                <p className="mt-1 break-all font-mono text-xs">{generatedInvite.link}</p>
                <button
                  className="btn-ghost mt-2"
                  onClick={() => navigator.clipboard.writeText(generatedInvite.link)}
                >
                  Copy link
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="glass-card">
          <h2 className="text-xl font-semibold text-red-500">Leave family group</h2>
          <p className="muted text-sm mt-1">
            If you leave, you’ll lose access to all shared lists. You can rejoin with a new invite.
          </p>
          <button className="btn mt-4 bg-red-500 hover:bg-red-600" onClick={leave}>
            Leave family
          </button>
        </div>
      </div>
    </div>
  );
}
