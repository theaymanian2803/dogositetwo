import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
