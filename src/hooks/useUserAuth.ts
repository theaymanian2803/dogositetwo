import { useEffect, useState } from "react";
import { turso } from "@/integrations/turso/client";

export function useUserAuth() {
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user_session");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user_session");
      }
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const rs = await turso.execute({
      sql: "SELECT id, email, name FROM users WHERE email = ? AND password = ?",
      args: [email, password],
    });
    if (rs.rows.length === 0) throw new Error("Invalid email or password");
    const u = {
      id: rs.rows[0].id as string,
      email: rs.rows[0].email as string,
      name: rs.rows[0].name as string,
    };
    localStorage.setItem("user_session", JSON.stringify(u));
    setUser(u);
    return u;
  }

  async function register(email: string, password: string, name: string) {
    const id = crypto.randomUUID();
    await turso.execute({
      sql: "INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)",
      args: [id, email, password, name],
    });
    return login(email, password);
  }

  function logout() {
    localStorage.removeItem("user_session");
    setUser(null);
  }

  return { user, loading, login, register, logout };
}
