import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLicense } from "@/hooks/useLicense";
import { useTour } from "@/hooks/useTour";
import { ActivateScreen } from "@/components/admin/ActivateScreen";
import { toast } from "sonner";

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const {
    status: license,
    isLoading: licenseLoading,
    isError: licenseError,
    refetch: refetchLicense,
  } = useLicense();
  const { tourActive } = useTour();

  useEffect(() => {
    document.title = "Sign in — PetPals";
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        toast.success("Welcome back!");
      } else {
        await signUp(email, password);
        toast.success("Account created");
      }
      const next = new URLSearchParams(window.location.search).get("next");
      navigate(next && next.startsWith("/") ? next : "/admin");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // While the first-run tour is open the admin login renders as part of the
  // guided preview; the license gate applies again once the tour closes.
  if (!tourActive) {
    if (licenseLoading)
      return (
        <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
          Checking license…
        </div>
      );

    if (licenseError)
      return (
        <div className="min-h-screen grid place-items-center px-4 bg-background">
          <div className="text-center max-w-md">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Couldn't verify your license
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn't reach your database to check the license. Check your connection and try
              again.
            </p>
            <button
              onClick={() => refetchLicense()}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-transform hover:scale-105"
            >
              Retry
            </button>
          </div>
        </div>
      );

    if (!license?.licensed) return <ActivateScreen brand="PetPals" />;
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div
        className="w-full max-w-md rounded-2xl bg-card p-8 shadow-xl shadow-primary/5"
        data-tour="admin-signin"
      >
        <Link to="/" className="text-sm text-muted-foreground hover:text-accent">
          ← Back to store
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-full border border-border bg-background px-4 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/25"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-full border border-border bg-background px-4 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/25"
          />
          <button disabled={loading} className="btn-accent h-11 w-full">
            {loading ? "..." : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <p className="mt-4 text-center font-mono text-xs text-muted-foreground">
          {mode === "signin"
            ? "Demo admin: admin@gmail.com / admin123"
            : "Create a demo account to manage your store"}
        </p>
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-sm text-muted-foreground hover:text-accent"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
