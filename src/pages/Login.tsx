import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function Login() {
  const { login, user } = useUserAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const redirect = redirectParam && redirectParam.startsWith("/") ? redirectParam : "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Sign in — PetPals";
  }, []);

  useEffect(() => {
    if (user) navigate(redirect);
  }, [user, navigate, redirect]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate(redirect);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 grid place-items-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-xl shadow-primary/5">
          <Link to="/" className="text-sm text-muted-foreground hover:text-accent">
            ← Back to store
          </Link>
          <h1 className="mt-4 font-display text-3xl font-bold">{t("login.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("login.subtitle")}</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <input
              type="email"
              required
              placeholder={t("login.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-full border border-border bg-background px-4 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/25"
            />
            <input
              type="password"
              required
              placeholder={t("login.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-full border border-border bg-background px-4 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/25"
            />
            <button disabled={loading} className="btn-accent h-11 w-full">
              {loading ? "..." : t("login.submit")}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link to="/register" className="text-accent hover:underline">
              {t("login.create")}
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
