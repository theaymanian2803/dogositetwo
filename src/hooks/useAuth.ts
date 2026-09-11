import { useEffect, useState } from "react";
import { turso } from "@/integrations/turso/client";

export function useAuth() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("session");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("session");
      }
    }
    setLoading(false);
  }, []);

  async function signIn(email: string, password: string) {
    const rs = await turso.execute({
      sql: "SELECT email FROM admins WHERE email = ? AND password = ?",
      args: [email, password],
    });
    if (rs.rows.length === 0) throw new Error("Invalid email or password");
    const u = { email: rs.rows[0].email as string };
    localStorage.setItem("session", JSON.stringify(u));
    setUser(u);
    return u;
  }

  async function signUp(email: string, password: string) {
    await turso.execute({
      sql: "INSERT INTO admins (email, password) VALUES (?, ?)",
      args: [email, password],
    });
    return signIn(email, password);
  }

  function signOut() {
    localStorage.removeItem("session");
    setUser(null);
  }

  return { user, loading, signIn, signUp, signOut };
}
