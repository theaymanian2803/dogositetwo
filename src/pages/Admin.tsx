import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useSettings, type Settings as StoreSettings } from "@/hooks/useSettings";
import { sampleCategories, sampleProducts } from "@/lib/sampleData";
import { turso, resetTursoClient } from "@/integrations/turso/client";
import { formatPrice } from "@/lib/currency";
import { clearTursoConfig, isUsingCustomConfig } from "@/lib/tursoConfig";
import { ensureSectionColumns } from "@/lib/setupDatabase";
import { TursoSettingsDialog } from "@/components/TursoSettingsDialog";
import { ControlsManager } from "@/components/admin/ControlsManager";
import {
  Box,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  DollarSign,
  Download,
  Hash,
  KeyRound,
  Layers,
  Lock,
  LogOut,
  MapPin,
  Menu,
  Package,
  PawPrint,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShoppingCart,
  Star,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  images: string | null;
  category: string;
  badge: string | null;
  tag: string | null;
};

type Category = { id: string; name: string; slug: string };

type OrderItem = { id: string; name: string; qty: number; price: number; image_url: string };
type Order = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  status: string;
  created_at: string;
};

type Review = {
  id: string;
  product_id: string;
  user_id: string | null;
  user_name: string;
  rating: number;
  title: string | null;
  body: string;
  image_url: string | null;
  status: string;
  created_at: string;
  product_name?: string;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const parseImages = (raw: string | null): string[] => {
  try {
    const arr = JSON.parse(raw ?? "[]");
    return Array.isArray(arr) ? [arr[0] ?? "", arr[1] ?? "", arr[2] ?? ""] : ["", "", ""];
  } catch {
    return ["", "", ""];
  }
};

const emptyForm = {
  name: "",
  description: "",
  price: "",
  image_url: "",
  images: ["", "", ""],
  category: "",
  badge: "",
  tag: "",
};

const emptyReviewForm = {
  product_id: "",
  user_name: "PetPals Team",
  rating: 5,
  title: "",
  body: "",
  image_url: "",
};

type Tab = "products" | "categories" | "orders" | "reviews" | "settings" | "data";

const settingsLabels: Record<keyof StoreSettings, string> = {
  brand_name: "Store name",
  brand_logo: "Brand logo image URL",
  tagline: "Footer tagline",
  hero_badge: "Hero badge text",
  hero_title: "Hero title",
  hero_subtitle: "Hero subtitle",
  promo_title: "Promo title",
  promo_old_price: "Promo old price",
  promo_price: "Promo price",
  hero_image: "Hero image URL",
  free_shipping_threshold: "Free delivery threshold (MAD)",
  shipping_fee: "Delivery fee (MAD)",
  delivery_note: "Delivery note (trust bar)",
  instagram_url: "Instagram URL",
  facebook_url: "Facebook URL",
  tiktok_url: "TikTok URL",
  homepage_sections: "Homepage sections",
  contact_email: "Contact email",
  contact_phone: "Contact phone",
  whatsapp_number: "WhatsApp number",
  contact_address: "Contact address",
  support_hours: "Support hours",
};

const settingsGroups: { title: string; fields: (keyof StoreSettings)[] }[] = [
  { title: "Store & Brand", fields: ["brand_name", "brand_logo", "tagline"] },
  {
    title: "Homepage",
    fields: [
      "hero_badge",
      "hero_title",
      "hero_subtitle",
      "hero_image",
      "promo_title",
      "promo_old_price",
      "promo_price",
    ],
  },
  {
    title: "Delivery",
    fields: ["free_shipping_threshold", "shipping_fee", "delivery_note"],
  },
  {
    title: "Contact info",
    fields: [
      "contact_email",
      "contact_phone",
      "whatsapp_number",
      "contact_address",
      "support_hours",
      "instagram_url",
      "facebook_url",
      "tiktok_url",
    ],
  },
];

const settingsTextareas = new Set<keyof StoreSettings>([
  "tagline",
  "hero_title",
  "hero_subtitle",
  "contact_address",
]);

const statusConfig: Record<string, { label: string; pill: string; dot: string }> = {
  new: {
    label: "New",
    pill: "bg-blue-50 text-blue-700 ring-blue-600/20",
    dot: "bg-blue-500",
  },
  processing: {
    label: "Processing",
    pill: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  shipped: {
    label: "Shipped",
    pill: "bg-violet-50 text-violet-700 ring-violet-600/20",
    dot: "bg-violet-500",
  },
  delivered: {
    label: "Delivered",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    pill: "bg-red-50 text-red-700 ring-red-600/20",
    dot: "bg-red-500",
  },
};

type ConfirmAction = {
  title: string;
  message: string;
  confirmLabel: string;
  variant: "destructive" | "default";
  password?: string;
  onConfirm: () => void;
} | null;

const DATA_GUARD_PASSWORD = "demo123";

const inputClass =
  "h-10 w-full rounded-full border border-border bg-background px-4 text-sm text-foreground outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/25";

export default function Admin() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isCompactOrders = useIsMobile(1280);
  const initialTab = (() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    return (["products", "categories", "orders", "reviews", "settings", "data"] as Tab[]).includes(
      t as Tab,
    )
      ? (t as Tab)
      : "orders";
  })();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  useEffect(() => {
    if (
      ["products", "categories", "orders", "reviews", "settings", "data"].includes(urlTab as Tab)
    ) {
      setTab(urlTab as Tab);
    }
  }, [urlTab]);
  const [tursoOpen, setTursoOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const extraFileRef = useRef<HTMLInputElement>(null);
  const extraSlotRef = useRef<number>(0);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [reviewForm, setReviewForm] = useState(emptyReviewForm);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const reviewFileRef = useRef<HTMLInputElement>(null);
  const { settings, refresh: refreshSettings } = useSettings();
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [credsForm, setCredsForm] = useState({ email: "", current: "", next: "", confirm: "" });
  const [changingCreds, setChangingCreds] = useState(false);
  const [dataBusy, setDataBusy] = useState(false);
  const [guardPassword, setGuardPassword] = useState("");

  useEffect(() => {
    setGuardPassword("");
  }, [confirm]);

  const isAdmin = !!user;
  const usingCustom = isUsingCustomConfig();

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  useEffect(() => {
    document.title = "Admin — PetPals";
  }, []);

  const pageTitle =
    tab === "orders"
      ? "Order Management"
      : tab === "products"
        ? "Product Management"
        : tab === "reviews"
          ? "Review Management"
          : tab === "settings"
            ? "Store Settings"
            : tab === "data"
              ? "Store Data"
              : "Category Management";

  async function ensureSchema() {
    const cols = await turso.execute("PRAGMA table_info(products)");
    if (!(cols.rows as unknown as { name: string }[]).some((c) => c.name === "images")) {
      await turso.execute("ALTER TABLE products ADD COLUMN images TEXT");
    }
    await ensureSectionColumns();
    const tables = await turso.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='reviews'",
    );
    if (tables.rows.length === 0) {
      await turso.execute(`
        CREATE TABLE reviews (
          id         TEXT PRIMARY KEY,
          product_id TEXT NOT NULL,
          user_id    TEXT,
          user_name  TEXT NOT NULL,
          rating     INTEGER NOT NULL,
          title      TEXT,
          body       TEXT NOT NULL,
          image_url  TEXT,
          status     TEXT NOT NULL DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT
      )
    `);
  }

  async function load() {
    await ensureSchema();
    const [pRs, cRs, oRs, rRs] = await Promise.all([
      turso.execute("SELECT * FROM products ORDER BY created_at DESC"),
      turso.execute("SELECT * FROM categories ORDER BY name"),
      turso.execute("SELECT * FROM orders ORDER BY created_at DESC"),
      turso.execute(
        "SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON r.product_id = p.id ORDER BY r.created_at DESC",
      ),
    ]);
    setProducts(pRs.rows as unknown as Product[]);
    setCategories(cRs.rows as unknown as Category[]);
    setReviews(rRs.rows as unknown as Review[]);
    setOrders(
      (oRs.rows as unknown as Record<string, unknown>[]).map((r) => ({
        ...r,
        items: typeof r.items === "string" ? JSON.parse(r.items as string) : (r.items ?? []),
      })) as Order[],
    );
    if (
      cRs.rows.length &&
      !cRs.rows.find((x) => (x as Record<string, unknown>).slug === form.category)
    ) {
      setForm((f) => ({ ...f, category: (cRs.rows[0] as Record<string, unknown>).slug as string }));
    }
  }

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  useEffect(() => {
    if (isMobile) {
      setTab("orders");
      setSidebarOpen(false);
      setShowForm(false);
      setEditingId(null);
      setConfirm(null);
    }
  }, [isMobile]);

  useEffect(() => {
    setPage(1);
  }, [orders.length]);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm({ ...form, image_url: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  function handleExtraUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    const slot = extraSlotRef.current;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => {
        const images = [...f.images];
        images[slot] = reader.result as string;
        return { ...f, images };
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  if (loading)
    return (
      <div className="min-h-screen grid place-items-center bg-secondary/50 text-muted-foreground">
        Loading…
      </div>
    );

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center px-4 bg-secondary/50">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/10">
            <PawPrint className="h-7 w-7 text-accent" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            Sign in required
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            You need to sign in as an admin to manage PetPals.
          </p>
          <Link
            to={`/auth?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}
            className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-semibold text-accent-foreground transition-transform hover:scale-105"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center px-4 bg-secondary/50">
        <div className="text-center max-w-md">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50">
            <LogOut className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">Not authorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your session is not tied to an admin account. Please sign in again.
          </p>
          <button
            onClick={() => {
              signOut();
              navigate("/auth");
            }}
            className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-semibold text-accent-foreground transition-transform hover:scale-105"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      image_url: p.image_url,
      images: parseImages(p.images),
      category: p.category,
      badge: p.badge ?? "",
      tag: p.tag ?? "",
    });
    setShowForm(true);
    setTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submitProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const price = parseFloat(form.price) || 0;
    const extraImages = form.images.map((u) => u.trim()).filter(Boolean);
    const imagesJson = extraImages.length ? JSON.stringify(extraImages) : null;
    try {
      if (editingId) {
        await turso.execute({
          sql: "UPDATE products SET name=?, description=?, price=?, image_url=?, images=?, category=?, badge=?, tag=? WHERE id=?",
          args: [
            form.name,
            form.description,
            price,
            form.image_url,
            imagesJson,
            form.category,
            form.badge || null,
            form.tag || null,
            editingId,
          ],
        });
        toast.success("Product updated");
      } else {
        await turso.execute({
          sql: "INSERT INTO products (id, name, slug, description, price, image_url, images, category, badge, tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          args: [
            crypto.randomUUID(),
            form.name,
            slugify(form.name) + "-" + Math.random().toString(36).slice(2, 6),
            form.description,
            price,
            form.image_url,
            imagesJson,
            form.category,
            form.badge || null,
            form.tag || null,
          ],
        });
        toast.success("Product added");
      }
      cancelEdit();
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving product");
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct(id: string) {
    setConfirm({
      title: "Delete this product?",
      message: "This product will be permanently removed from the store. Your pets will miss it.",
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await turso.execute({ sql: "DELETE FROM products WHERE id = ?", args: [id] });
          toast.success("Product deleted");
          if (editingId === id) cancelEdit();
          load();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Error deleting product");
        }
      },
    });
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    try {
      await turso.execute({
        sql: "INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)",
        args: [crypto.randomUUID(), name, slugify(name)],
      });
      toast.success("Category added");
      setNewCategory("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error adding category");
    }
  }

  async function removeCategory(id: string) {
    setConfirm({
      title: "Delete this category?",
      message:
        "This category will be permanently removed. Products in this category won't be affected.",
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await turso.execute({ sql: "DELETE FROM categories WHERE id = ?", args: [id] });
          toast.success("Category deleted");
          load();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Error deleting category");
        }
      },
    });
  }

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      await turso.execute({
        sql: "UPDATE orders SET status = ? WHERE id = ?",
        args: [status, orderId],
      });
      toast.success("Order updated");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error updating order");
    }
  }

  async function deleteOrder(id: string) {
    setConfirm({
      title: "Delete this order?",
      message:
        "This order will be permanently removed. Your customer won't be able to track it anymore.",
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await turso.execute({ sql: "DELETE FROM orders WHERE id = ?", args: [id] });
          toast.success("Order deleted");
          load();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Error deleting order");
        }
      },
    });
  }

  async function setReviewStatus(reviewId: string, status: string) {
    try {
      await turso.execute({
        sql: "UPDATE reviews SET status = ? WHERE id = ?",
        args: [status, reviewId],
      });
      toast.success(status === "approved" ? "Review approved" : "Review rejected");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error updating review");
    }
  }

  async function deleteReview(id: string) {
    setConfirm({
      title: "Delete this review?",
      message: "This review will be permanently removed.",
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await turso.execute({ sql: "DELETE FROM reviews WHERE id = ?", args: [id] });
          toast.success("Review deleted");
          load();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Error deleting review");
        }
      },
    });
  }

  function handleReviewFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReviewForm({ ...reviewForm, image_url: reader.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setSavingReview(true);
    try {
      await turso.execute({
        sql: "INSERT INTO reviews (id, product_id, user_id, user_name, rating, title, body, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')",
        args: [
          crypto.randomUUID(),
          reviewForm.product_id,
          null,
          reviewForm.user_name.trim(),
          reviewForm.rating,
          reviewForm.title.trim() || null,
          reviewForm.body.trim(),
          reviewForm.image_url || null,
        ],
      });
      toast.success("Review published");
      setReviewForm(emptyReviewForm);
      setShowReviewForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error adding review");
    } finally {
      setSavingReview(false);
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      for (const [key, value] of Object.entries(settingsForm)) {
        await turso.execute({
          sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
          args: [key, value],
        });
      }
      await refreshSettings();
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving settings");
    } finally {
      setSavingSettings(false);
    }
  }

  async function changeCredentials(e: React.FormEvent) {
    e.preventDefault();
    const newEmail = credsForm.email.trim();
    const adminEmail = user?.email ?? "";
    const hasEmail = newEmail && newEmail !== adminEmail;
    const hasPassword = credsForm.next.length > 0;
    if (!hasEmail && !hasPassword) {
      toast.error("Enter a new email or a new password");
      return;
    }
    if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (hasPassword) {
      if (credsForm.next !== credsForm.confirm) {
        toast.error("New passwords don't match");
        return;
      }
      if (credsForm.next.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
    }
    setChangingCreds(true);
    try {
      const rs = await turso.execute({
        sql: "SELECT email FROM admins WHERE email = ? AND password = ?",
        args: [adminEmail, credsForm.current],
      });
      if (rs.rows.length === 0) {
        toast.error("Current password is incorrect");
        return;
      }
      if (hasPassword) {
        await turso.execute({
          sql: "UPDATE admins SET password = ? WHERE email = ?",
          args: [credsForm.next, adminEmail],
        });
      }
      if (hasEmail) {
        await turso.execute({
          sql: "UPDATE admins SET email = ? WHERE email = ?",
          args: [newEmail, adminEmail],
        });
      }
      localStorage.setItem("session", JSON.stringify({ email: hasEmail ? newEmail : adminEmail }));
      toast.success(
        hasEmail && hasPassword
          ? "Admin login and password updated"
          : hasEmail
            ? "Admin login updated"
            : "Password updated",
      );
      setCredsForm({ email: "", current: "", next: "", confirm: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error updating credentials");
    } finally {
      setChangingCreds(false);
    }
  }

  async function exportData() {
    setDataBusy(true);
    try {
      const [pRs, cRs, oRs, rRs] = await Promise.all([
        turso.execute("SELECT * FROM products ORDER BY created_at DESC"),
        turso.execute("SELECT * FROM categories ORDER BY name"),
        turso.execute("SELECT * FROM orders ORDER BY created_at DESC"),
        turso.execute("SELECT * FROM reviews ORDER BY created_at DESC"),
      ]);
      const payload = {
        exportedAt: new Date().toISOString(),
        categories: cRs.rows,
        products: pRs.rows,
        orders: oRs.rows,
        reviews: rRs.rows,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `store-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error exporting data");
    } finally {
      setDataBusy(false);
    }
  }

  function confirmLoadSample() {
    setConfirm({
      title: "Load sample data?",
      message: `This adds ${sampleCategories.length} sample categories and ${sampleProducts.length} sample products to your store. Your existing data is kept.`,
      confirmLabel: "Load sample data",
      variant: "default",
      onConfirm: async () => {
        setDataBusy(true);
        try {
          for (const c of sampleCategories) {
            await turso.execute({
              sql: "INSERT OR IGNORE INTO categories (id, name, slug) VALUES (?, ?, ?)",
              args: [crypto.randomUUID(), c.name, c.slug],
            });
          }
          for (const p of sampleProducts) {
            await turso.execute({
              sql: "INSERT INTO products (id, name, slug, description, price, image_url, category, badge, tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
              args: [
                crypto.randomUUID(),
                p.name,
                slugify(p.name) + "-" + Math.random().toString(36).slice(2, 6),
                p.description,
                p.price,
                p.image_url,
                p.category,
                p.badge,
                p.tag,
              ],
            });
          }
          toast.success(`Loaded ${sampleProducts.length} sample products`);
          load();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Error loading sample data");
        } finally {
          setDataBusy(false);
        }
      },
    });
  }

  function confirmClearData() {
    setConfirm({
      title: "Clear all store data?",
      message:
        "This permanently deletes ALL products, categories, orders and reviews. Your settings are kept. This cannot be undone — export a backup first! This is a demo store, so a guard password is required to continue.",
      confirmLabel: "Delete everything",
      variant: "destructive",
      password: DATA_GUARD_PASSWORD,
      onConfirm: async () => {
        setDataBusy(true);
        try {
          await turso.execute("DELETE FROM products");
          await turso.execute("DELETE FROM categories");
          await turso.execute("DELETE FROM orders");
          await turso.execute("DELETE FROM reviews");
          toast.success("Store data cleared");
          load();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Error clearing data");
        } finally {
          setDataBusy(false);
        }
      },
    });
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const pendingOrders = orders.filter(
    (o) => o.status === "new" || o.status === "processing",
  ).length;
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(orders.length / perPage));
  const paginatedOrders = orders.slice((page - 1) * perPage, page * perPage);

  const navItems: { key: Tab; label: string; icon: typeof Box; count: number }[] = [
    { key: "products", label: "Products", icon: Package, count: products.length },
    { key: "categories", label: "Categories", icon: Layers, count: categories.length },
    {
      key: "reviews",
      label: "Reviews",
      icon: Star,
      count: reviews.filter((r) => r.status === "pending").length,
    },
    { key: "orders", label: "Orders", icon: ShoppingCart, count: orders.length },
    { key: "settings", label: "Settings", icon: Settings, count: 0 },
    { key: "data", label: "Store Data", icon: Database, count: 0 },
  ];

  return (
    <div className="flex min-h-screen bg-secondary/50 lg:h-screen lg:overflow-hidden">
      {/* Mobile sidebar overlay */}
      {!isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {!isMobile && (
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary text-primary-foreground border-r border-primary-foreground/10 flex flex-col transition-transform lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {/* Brand */}
          <div className="flex items-center gap-2.5 px-5 h-16 border-b border-primary-foreground/10">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-foreground/10">
              <PawPrint className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">PetPals</span>
            <span className="ml-auto rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/80">
              Admin
            </span>
          </div>

          {/* Nav */}
          <nav
            data-tour="admin-dashboard"
            className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1"
          >
            {navItems.map((item) => (
              <button
                key={item.key}
                data-tour={item.key === "settings" ? "nav-settings" : undefined}
                onClick={() => {
                  setTab(item.key);
                  setSidebarOpen(false);
                  cancelEdit();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-all ${
                  tab === item.key
                    ? "bg-primary text-accent-foreground"
                    : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
                {item.count > 0 && (
                  <span
                    className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      tab === item.key
                        ? "bg-accent-foreground/20 text-accent-foreground"
                        : "bg-primary-foreground/10 text-primary-foreground/70"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* User info */}
          <div className="border-t border-primary-foreground/10 px-4 py-4">
            <p className="text-xs text-primary-foreground/70 truncate">{user.email}</p>
            <button
              onClick={() => {
                signOut();
                navigate("/");
              }}
              className="mt-2 flex items-center gap-1.5 text-xs text-primary-foreground/70 hover:text-red-300 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </aside>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-3">
              {!isMobile && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden grid h-9 w-9 place-items-center rounded-full border border-border bg-background hover:bg-secondary transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5 text-foreground" />
                </button>
              )}
              <h1 className="font-display text-lg font-bold tracking-tight text-foreground">
                {pageTitle}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-muted-foreground">{user.email}</span>
              <button
                onClick={() => {
                  signOut();
                  navigate("/");
                }}
                className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 h-9 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main
          className={`flex-1 min-h-0 ${tab === "orders" ? "overflow-hidden flex flex-col" : "overflow-y-auto"}`}
        >
          {/* ───── STATS ROW ───── */}
          <div className="px-4 sm:px-6 pt-6 pb-2">
            <div className="hidden md:grid grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { label: "Total Products", value: products.length, icon: Package },
                { label: "Categories", value: categories.length, icon: Layers },
                { label: "Pending Orders", value: pendingOrders, icon: ShoppingCart },
                {
                  label: "Revenue",
                  value: formatPrice(totalRevenue),
                  icon: DollarSign,
                  accent: true,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-card rounded-2xl border border-border p-5 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${s.accent ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"}`}
                    >
                      <s.icon className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ───── CONTENT ───── */}
          <div
            className={`px-4 sm:px-6 ${tab === "orders" ? "pt-4 pb-0 flex flex-col flex-1 min-h-0" : "py-6"}`}
          >
            {/* ───── ORDERS TAB ───── */}
            {tab === "orders" && (
              <div className="flex-1 min-h-0 overflow-auto">
                {orders.length === 0 && (
                  <div className="rounded-2xl bg-card p-12 text-center shadow-sm">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary">
                      <Package className="h-7 w-7 text-muted-foreground/60" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-foreground">No orders yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Orders will appear here once customers check out.
                    </p>
                  </div>
                )}
                {orders.length > 0 &&
                  (isCompactOrders ? (
                    <div className="space-y-3 pb-4">
                      {paginatedOrders.map((o) => {
                        const shortId = o.id.slice(0, 8).toUpperCase();
                        const initials =
                          ((o.first_name?.[0] ?? "") + (o.last_name?.[0] ?? "")).toUpperCase() ||
                          "?";
                        const dateStr = new Date(o.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        });
                        return (
                          <div key={o.id} className="overflow-hidden rounded-2xl bg-card shadow-sm">
                            <div className="flex items-start justify-between gap-3 px-5 py-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-muted-foreground">
                                  <Hash className="h-3 w-3" />
                                  <span>ORD-{shortId}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="h-8 w-8 shrink-0 rounded-full bg-secondary flex items-center justify-center text-[11px] font-bold text-foreground">
                                    {initials}
                                  </div>
                                  <span className="text-sm font-semibold text-foreground truncate">
                                    {o.first_name} {o.last_name}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">{dateStr}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-base font-bold tracking-tight text-foreground">
                                  {formatPrice(o.total)}
                                </div>
                                <span
                                  className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                    statusConfig[o.status]?.pill || "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5  ${statusConfig[o.status]?.dot || "bg-muted-foreground"}`}
                                  />
                                  {statusConfig[o.status]?.label || o.status}
                                </span>
                              </div>
                            </div>

                            <div className="px-5 py-3 bg-secondary/50 space-y-2">
                              {(o.items ?? []).map((it, idx) => (
                                <div key={idx} className="flex items-center gap-2.5">
                                  <div className="h-9 w-9 shrink-0 rounded-xl border border-border bg-secondary flex items-center justify-center overflow-hidden">
                                    {it.image_url ? (
                                      <img
                                        src={it.image_url}
                                        alt={it.name}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <Package className="h-4 w-4 text-muted-foreground/60" />
                                    )}
                                  </div>
                                  <span className="text-xs text-foreground flex-1 min-w-0 truncate leading-tight">
                                    {it.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground shrink-0">
                                    ×{it.qty}
                                  </span>
                                  <span className="text-xs font-medium text-foreground shrink-0 w-14 text-right">
                                    {formatPrice(it.qty * it.price)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="px-5 py-3 space-y-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                                <span className="truncate">{o.phone}</span>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground/60" />
                                <span className="leading-snug">{o.address}</span>
                              </div>
                            </div>

                            <div className="px-5 py-3 space-y-2">
                              <StatusMenu
                                current={o.status}
                                onUpdate={(s) => updateOrderStatus(o.id, s)}
                              />
                              <button
                                onClick={() => deleteOrder(o.id)}
                                className="flex items-center justify-center gap-1.5 w-full rounded-full bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 active:bg-red-200 transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-card rounded-2xl shadow-sm overflow-x-auto">
                      {/* Header row */}
                      <div className="grid grid-cols-[160px_180px_100px_1fr_90px_170px] gap-4 px-6 py-3 bg-secondary/60 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[900px]">
                        <div>Order & Customer</div>
                        <div>Date & Contact</div>
                        <div>Status</div>
                        <div>Products</div>
                        <div>Total</div>
                        <div>Actions</div>
                      </div>
                      <div className="min-w-[900px]">
                        {paginatedOrders.map((o) => {
                          const shortId = o.id.slice(0, 8).toUpperCase();
                          const initials =
                            ((o.first_name?.[0] ?? "") + (o.last_name?.[0] ?? "")).toUpperCase() ||
                            "?";
                          const dateStr = new Date(o.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          });
                          return (
                            <div
                              key={o.id}
                              className="grid grid-cols-[160px_180px_100px_1fr_90px_170px] gap-4 px-6 py-4 hover:bg-secondary/40 transition-colors"
                            >
                              {/* Col 1: Order ID & Customer */}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-muted-foreground">
                                  <Hash className="h-3 w-3" />
                                  <span>ORD-{shortId}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="h-7 w-7 shrink-0 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-foreground">
                                    {initials}
                                  </div>
                                  <span className="text-sm font-semibold text-foreground truncate">
                                    {o.first_name} {o.last_name}
                                  </span>
                                </div>
                              </div>

                              {/* Col 2: Dates & Contact */}
                              <div className="min-w-0">
                                <div className="text-sm text-foreground font-medium">{dateStr}</div>
                                <div className="flex items-start gap-1.5 mt-1.5">
                                  <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground/60" />
                                  <span className="text-[11px] text-muted-foreground leading-snug">
                                    {o.address}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <Phone className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                                  <span className="text-[11px] text-muted-foreground">
                                    {o.phone}
                                  </span>
                                </div>
                              </div>

                              {/* Col 3: Status */}
                              <div className="min-w-0 pt-1">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                    statusConfig[o.status]?.pill || "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${statusConfig[o.status]?.dot || "bg-muted-foreground"}`}
                                  />
                                  {statusConfig[o.status]?.label || o.status}
                                </span>
                              </div>

                              {/* Col 4: Products */}
                              <div className="min-w-0 space-y-1.5">
                                {(o.items ?? []).map((it, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <div className="h-8 w-8 shrink-0 rounded-lg border border-border bg-secondary flex items-center justify-center overflow-hidden">
                                      {it.image_url ? (
                                        <img
                                          src={it.image_url}
                                          alt={it.name}
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <Package className="h-4 w-4 text-muted-foreground/60" />
                                      )}
                                    </div>
                                    <span className="text-[11px] text-foreground flex-1 min-w-0 truncate leading-tight">
                                      {it.name}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground shrink-0">
                                      ×{it.qty}
                                    </span>
                                    <span className="text-[11px] font-medium text-foreground w-14 text-right shrink-0">
                                      {formatPrice(it.qty * it.price)}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* Col 5: Total */}
                              <div className="min-w-0 pt-1">
                                <div className="text-base font-bold tracking-tight text-foreground">
                                  {formatPrice(o.total)}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                  Tax incl.
                                </div>
                              </div>

                              {/* Col 6: Actions */}
                              <div className="min-w-0 space-y-2 pt-1">
                                <StatusMenu
                                  current={o.status}
                                  onUpdate={(s) => updateOrderStatus(o.id, s)}
                                />
                                <button
                                  onClick={() => deleteOrder(o.id)}
                                  className="flex items-center justify-center gap-1.5 w-full rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 active:bg-red-200 transition-all"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete Order
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between gap-3 px-4 py-4 text-xs text-muted-foreground">
                    <div>
                      Showing {(page - 1) * perPage + 1}&ndash;
                      {Math.min(page * perPage, orders.length)} of {orders.length}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-1 px-3.5 h-8 rounded-full bg-card text-foreground hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none transition-colors"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Prev
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`min-w-8 h-8 px-2 rounded-full text-xs font-medium transition-colors ${
                            p === page
                              ? "bg-foreground text-background"
                              : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="flex items-center gap-1 px-3.5 h-8 rounded-full bg-card text-foreground hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none transition-colors"
                      >
                        Next <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ───── PRODUCTS TAB ───── */}
            {tab === "products" && (
              <div>
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold tracking-tight text-foreground">Products</h2>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      {filteredProducts.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setForm(emptyForm);
                      setShowForm(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 h-10 text-sm font-semibold text-accent-foreground transition-transform hover:scale-105"
                  >
                    <Plus className="h-4 w-4" /> Add Product
                  </button>
                </div>

                <div className="relative mb-5 max-w-sm">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search products…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-full border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/25"
                  />
                </div>
                <div className="space-y-2.5">
                  {filteredProducts.length === 0 && (
                    <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-10 text-center">
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary">
                        <Box className="h-6 w-6 text-muted-foreground/60" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-foreground">
                        No products found
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Try a different search term.
                      </p>
                    </div>
                  )}
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-4 bg-card rounded-2xl border border-border p-3.5 transition-all hover:shadow-sm"
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatPrice(p.price)} · {p.category}
                        </p>
                        {p.badge && (
                          <span className="mt-1.5 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(p)}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-secondary transition-colors"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => removeProduct(p.id)}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-red-50 transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ───── CATEGORIES TAB ───── */}
            {tab === "categories" && (
              <div className="max-w-lg">
                <form onSubmit={addCategory} className="flex gap-2 mb-4">
                  <input
                    placeholder="New category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className={inputClass}
                  />
                  <button className="inline-flex items-center gap-1.5 h-10 shrink-0 rounded-full bg-primary px-5 text-sm font-semibold text-accent-foreground transition-transform hover:scale-105">
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </form>
                <div className="space-y-2.5">
                  {categories.length === 0 && (
                    <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-10 text-center">
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary">
                        <Layers className="h-6 w-6 text-muted-foreground/60" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-foreground">
                        No categories yet
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Add your first category to organize products.
                      </p>
                    </div>
                  )}
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between bg-card rounded-2xl border border-border px-4 py-3.5 transition-shadow hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent text-sm font-bold uppercase">
                          {c.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{c.name}</p>
                          <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                            /{c.slug}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeCategory(c.id)}
                        className="grid h-9 w-9 place-items-center rounded-full hover:bg-red-50 transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ───── REVIEWS TAB ───── */}
            {tab === "reviews" && (
              <div>
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold tracking-tight text-foreground">Reviews</h2>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      {reviews.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setReviewForm(emptyReviewForm);
                      setShowReviewForm(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 h-10 text-sm font-semibold text-accent-foreground transition-transform hover:scale-105"
                  >
                    <Plus className="h-4 w-4" /> Add Review
                  </button>
                </div>

                <div className="space-y-2.5">
                  {reviews.length === 0 && (
                    <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-10 text-center">
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary">
                        <Star className="h-6 w-6 text-muted-foreground/60" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-foreground">No reviews yet</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Reviews from customers will appear here for moderation.
                      </p>
                    </div>
                  )}
                  {reviews.map((r) => {
                    const dateStr = new Date(r.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    });
                    const initials =
                      (r.user_name?.[0] ?? "?").toUpperCase() +
                      (r.user_name?.[1] ?? "").toUpperCase();
                    const statusPill: Record<string, string> = {
                      pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
                      approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
                      rejected: "bg-red-50 text-red-700 ring-red-600/20",
                    };
                    return (
                      <div
                        key={r.id}
                        className="flex flex-col gap-4 bg-card rounded-2xl border border-border p-4 sm:flex-row sm:items-start"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-secondary">
                            {r.image_url ? (
                              <img
                                src={r.image_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-xs font-bold text-muted-foreground">
                                {initials}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-sm font-semibold text-foreground">
                                {r.user_name}
                              </span>
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {r.status}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                  key={i}
                                  className={`h-3.5 w-3.5 ${i <= r.rating ? "fill-accent text-accent" : "text-border"}`}
                                />
                              ))}
                              <span className="ml-1.5 text-[11px] text-muted-foreground">
                                {dateStr}
                              </span>
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground truncate max-w-full">
                              on{" "}
                              <span className="font-medium text-foreground">{r.product_name}</span>
                            </p>
                            {r.title && (
                              <p className="mt-2 text-sm font-semibold text-foreground">
                                {r.title}
                              </p>
                            )}
                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                              {r.body}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 sm:flex-col sm:items-end">
                          {r.status === "pending" && (
                            <>
                              <button
                                onClick={() => setReviewStatus(r.id, "approved")}
                                className="inline-flex h-9 items-center gap-1 rounded-full bg-emerald-50 px-4 text-xs font-medium text-emerald-600 hover:bg-emerald-100 transition-colors"
                              >
                                <Check className="h-3.5 w-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => setReviewStatus(r.id, "rejected")}
                                className="inline-flex h-9 items-center gap-1 rounded-full bg-red-50 px-4 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" /> Reject
                              </button>
                            </>
                          )}
                          {r.status !== "pending" && (
                            <button
                              onClick={() => setReviewStatus(r.id, "pending")}
                              className="inline-flex h-9 items-center gap-1 rounded-full bg-muted px-4 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
                            >
                              Unpublish
                            </button>
                          )}
                          <button
                            onClick={() => deleteReview(r.id)}
                            className="grid h-9 w-9 place-items-center rounded-full hover:bg-red-50 transition-colors"
                            aria-label="Delete review"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ───── SETTINGS TAB ───── */}
            {tab === "settings" && (
              <div className="max-w-2xl space-y-6 pb-6">
                <form onSubmit={saveSettings} className="space-y-6">
                  {settingsGroups.map((group) => (
                    <section
                      key={group.title}
                      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                    >
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        {group.title}
                      </h3>
                      <div className="mt-4 space-y-4">
                        {group.fields.map((key) => (
                          <div key={key} className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">
                              {settingsLabels[key]}
                            </label>
                            {settingsTextareas.has(key) ? (
                              <textarea
                                rows={key === "hero_title" ? 2 : 3}
                                value={settingsForm[key]}
                                onChange={(e) =>
                                  setSettingsForm((f) => ({ ...f, [key]: e.target.value }))
                                }
                                className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/25 resize-none"
                              />
                            ) : (
                              <input
                                value={settingsForm[key]}
                                onChange={(e) =>
                                  setSettingsForm((f) => ({ ...f, [key]: e.target.value }))
                                }
                                className={inputClass}
                              />
                            )}
                            {key === "hero_title" && (
                              <p className="text-[11px] text-muted-foreground">
                                Put each line of your headline on its own row.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                  <button
                    disabled={savingSettings}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-accent-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {savingSettings ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                        Saving…
                      </span>
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> Save Settings
                      </>
                    )}
                  </button>
                </form>

                <ControlsManager />

                <section
                  data-tour="admin-db"
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Database connection
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    This store runs on a shared demo database out of the box. Connect your own Turso
                    database to keep your data private.
                  </p>
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
                    <span
                      className={`h-2 w-2 rounded-full ${usingCustom ? "bg-emerald-400" : "bg-amber-400"}`}
                    />
                    {usingCustom ? "Your database" : "Demo database — shared demo data"}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setTursoOpen(true)}
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-accent-foreground transition-all hover:opacity-90 active:scale-[0.98]"
                    >
                      <Database className="h-4 w-4" />
                      {usingCustom ? "Edit database" : "Connect your database"}
                    </button>
                    {usingCustom && (
                      <button
                        onClick={() => {
                          clearTursoConfig();
                          resetTursoClient();
                          toast.success("Back to the demo database. Reloading…");
                          setTimeout(() => window.location.reload(), 700);
                        }}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-semibold text-foreground transition-all hover:bg-secondary active:scale-[0.98]"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset to demo
                      </button>
                    )}
                  </div>
                </section>

                <section
                  data-tour="admin-creds"
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Admin credentials
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Change the login email and/or password used to access this dashboard. You'll
                    need your current password to make a change.
                  </p>
                  {usingCustom ? (
                    <form onSubmit={changeCredentials} className="mt-4 space-y-3">
                      <input
                        type="email"
                        placeholder="New email (optional)"
                        value={credsForm.email}
                        onChange={(e) => setCredsForm({ ...credsForm, email: e.target.value })}
                        className={inputClass}
                      />
                      <input
                        type="password"
                        required
                        placeholder="Current password"
                        value={credsForm.current}
                        onChange={(e) => setCredsForm({ ...credsForm, current: e.target.value })}
                        className={inputClass}
                      />
                      <input
                        type="password"
                        placeholder="New password (optional)"
                        value={credsForm.next}
                        onChange={(e) => setCredsForm({ ...credsForm, next: e.target.value })}
                        className={inputClass}
                      />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        value={credsForm.confirm}
                        onChange={(e) => setCredsForm({ ...credsForm, confirm: e.target.value })}
                        className={inputClass}
                      />
                      <button
                        disabled={changingCreds}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-semibold text-foreground transition-all hover:bg-secondary active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                      >
                        <KeyRound className="h-4 w-4" />
                        {changingCreds ? "Updating…" : "Update credentials"}
                      </button>
                    </form>
                  ) : (
                    <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        Connect your own database first — the admin credentials can only be changed
                        on your own instance.
                      </span>
                    </div>
                  )}
                </section>
              </div>
            )}

            <TursoSettingsDialog open={tursoOpen} onOpenChange={setTursoOpen} />

            {/* ───── DATA TAB ───── */}
            {tab === "data" && (
              <div className="max-w-2xl space-y-6 pb-6">
                <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Backup your store
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Download all products, categories, orders and reviews as a JSON file. Keep a
                    copy before clearing or changing your data.
                  </p>
                  <button
                    onClick={exportData}
                    disabled={dataBusy}
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-accent-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {dataBusy ? "Exporting…" : "Download backup"}
                  </button>
                </section>

                <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Load sample data
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Add {sampleCategories.length} sample categories and {sampleProducts.length}{" "}
                    sample products to preview the store. Your existing data is kept.
                  </p>
                  <button
                    onClick={confirmLoadSample}
                    disabled={dataBusy}
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-accent-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                  >
                    <UploadCloud className="h-4 w-4" /> Load sample data
                  </button>
                </section>

                <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-red-600">
                    Danger zone
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Permanently delete every product, category, order and review in your store. Your
                    settings are kept. This cannot be undone.
                  </p>
                  <button
                    onClick={confirmClearData}
                    disabled={dataBusy}
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-red-500 px-5 text-sm font-semibold text-white transition-all hover:bg-red-600 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" /> Clear all store data
                  </button>
                </section>
              </div>
            )}
          </div>
        </main>

        {/* ───── CONFIRMATION MODAL ───── */}
        {confirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-foreground/40 backdrop-blur-sm"
              onClick={() => setConfirm(null)}
            />
            <div className="relative bg-card shadow-xl shadow-foreground/10 w-full max-w-sm rounded-2xl border border-border">
              <div className="flex items-center justify-between px-6 pt-5 pb-0">
                <div className="w-7" />
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                  <PawPrint className="h-6 w-6 text-accent" />
                </div>
                <button
                  onClick={() => setConfirm(null)}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-[0.98] transition-all"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-6 pt-4 pb-6 flex flex-col items-center text-center">
                <h3 className="text-lg font-bold tracking-tight text-foreground">
                  {confirm.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {confirm.message}
                </p>
                {confirm.password && (
                  <div className="mt-4 w-full">
                    <input
                      type="password"
                      placeholder="Guard password"
                      value={guardPassword}
                      onChange={(e) => setGuardPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && guardPassword === confirm.password) {
                          confirm.onConfirm();
                          setConfirm(null);
                        }
                      }}
                      autoFocus
                      className="h-10 w-full rounded-full border border-border bg-background px-4 text-center text-sm text-foreground outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/25"
                    />
                    <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                      Demo guard password: {DATA_GUARD_PASSWORD}
                    </p>
                  </div>
                )}
              </div>
              <div className="px-6 pb-6 flex justify-center gap-2.5">
                <button
                  onClick={() => setConfirm(null)}
                  className="h-10 px-5 rounded-full border border-border bg-background text-sm font-semibold text-foreground hover:bg-secondary active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirm.onConfirm();
                    setConfirm(null);
                  }}
                  disabled={!!confirm.password && guardPassword !== confirm.password}
                  className={`h-10 px-6 text-sm font-semibold text-white active:scale-[0.98] transition-all rounded-full ${
                    confirm.variant === "destructive"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-primary hover:opacity-90"
                  } disabled:pointer-events-none disabled:opacity-40`}
                >
                  {confirm.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ───── PRODUCT FORM MODAL ───── */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12">
            <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm" onClick={cancelEdit} />
            <div className="relative bg-card shadow-xl shadow-foreground/10 w-full max-w-lg mx-4 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl border border-border">
              <div className="flex items-center justify-between px-6 pt-5 pb-0">
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  {editingId ? "Edit Product" : "Add Product"}
                </h2>
                <button
                  onClick={cancelEdit}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-[0.98] transition-all"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={submitProduct} className="px-6 pt-5 pb-6 space-y-5">
                {/* Basic Info */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Basic Info
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Name</label>
                      <input
                        required
                        placeholder="e.g. Premium Dog Food"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Description</label>
                      <textarea
                        required
                        placeholder="Describe the product…"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={3}
                        className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/25 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing & Category */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Pricing & Category
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Price</label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/60">
                          MAD
                        </span>
                        <input
                          required
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                          className={inputClass.replace("px-4", "pl-8 pr-4")}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className={inputClass}
                      >
                        <option value="" disabled>
                          Select…
                        </option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Media */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Media
                  </h3>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="group relative flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-background p-6 transition-all hover:border-accent/50 hover:bg-accent/5"
                  >
                    {form.image_url ? (
                      <>
                        <img
                          src={form.image_url}
                          alt="Preview"
                          className="h-36 w-full max-w-[240px] rounded-xl object-cover shadow-sm"
                        />
                        <span className="text-xs text-muted-foreground">Click to change image</span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 transition-colors group-hover:bg-accent/20">
                          <Upload className="h-6 w-6 text-accent" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">Upload image</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            PNG or JPG — max 2MB
                          </p>
                        </div>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-2 text-[10px] uppercase tracking-wider text-muted-foreground/60">
                        or
                      </span>
                    </div>
                  </div>
                  <input
                    type="url"
                    placeholder="Paste image URL…"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    className={inputClass}
                  />

                  {/* Additional images */}
                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Additional Images (optional)
                    </p>
                    <div className="space-y-3">
                      {form.images.map((img, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              extraSlotRef.current = i;
                              extraFileRef.current?.click();
                            }}
                            className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-background transition-colors hover:bg-secondary"
                            aria-label={`Upload additional image ${i + 1}`}
                          >
                            {img ? (
                              <img
                                src={img}
                                alt={`Additional image ${i + 1}`}
                                className="h-full w-full rounded-xl object-cover"
                              />
                            ) : (
                              <Upload className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          <input
                            type="url"
                            placeholder={`Additional image ${i + 1} URL…`}
                            value={img}
                            onChange={(e) =>
                              setForm((f) => {
                                const images = [...f.images];
                                images[i] = e.target.value;
                                return { ...f, images };
                              })
                            }
                            className={inputClass}
                          />
                          {img && (
                            <button
                              type="button"
                              onClick={() =>
                                setForm((f) => {
                                  const images = [...f.images];
                                  images[i] = "";
                                  return { ...f, images };
                                })
                              }
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
                              aria-label="Remove image"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <input
                      ref={extraFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleExtraUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Extras */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Extras
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Badge</label>
                      <input
                        placeholder="e.g. -20%"
                        value={form.badge}
                        onChange={(e) => setForm({ ...form, badge: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Tag</label>
                      <input
                        placeholder="e.g. XL"
                        value={form.tag}
                        onChange={(e) => setForm({ ...form, tag: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <button
                  disabled={saving}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary font-semibold text-accent-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                      Saving…
                    </span>
                  ) : editingId ? (
                    <>
                      <Pencil className="h-4 w-4" /> Update Product
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" /> Add Product
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ───── ADD REVIEW MODAL ───── */}
        {showReviewForm && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12">
            <div
              className="fixed inset-0 bg-foreground/40 backdrop-blur-sm"
              onClick={() => setShowReviewForm(false)}
            />
            <div className="relative bg-card shadow-xl shadow-foreground/10 w-full max-w-lg mx-4 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl border border-border">
              <div className="flex items-center justify-between px-6 pt-5 pb-0">
                <h2 className="text-lg font-bold tracking-tight text-foreground">Add Review</h2>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-[0.98] transition-all"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={submitReview} className="px-6 pt-5 pb-6 space-y-5">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Product</label>
                    <select
                      required
                      value={reviewForm.product_id}
                      onChange={(e) => setReviewForm({ ...reviewForm, product_id: e.target.value })}
                      className={inputClass}
                    >
                      <option value="" disabled>
                        Select a product…
                      </option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Reviewer name</label>
                    <input
                      required
                      placeholder="e.g. PetPals Team"
                      value={reviewForm.user_name}
                      onChange={(e) => setReviewForm({ ...reviewForm, user_name: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Rating</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: i })}
                          className="p-1 transition-transform hover:scale-110"
                          aria-label={`Rate ${i} out of 5 stars`}
                        >
                          <Star
                            className={`h-7 w-7 ${i <= reviewForm.rating ? "fill-accent text-accent" : "text-border"}`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground">
                        {reviewForm.rating}/5
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Title (optional)</label>
                    <input
                      placeholder="e.g. Perfect for my puppy"
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Review</label>
                    <textarea
                      required
                      placeholder="Share your experience…"
                      value={reviewForm.body}
                      onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
                      rows={4}
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/25 resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Photo (optional)</label>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => reviewFileRef.current?.click()}
                        className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-background transition-colors hover:bg-secondary"
                        aria-label="Upload review photo"
                      >
                        {reviewForm.image_url ? (
                          <img
                            src={reviewForm.image_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Upload className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <input
                        type="url"
                        placeholder="Paste image URL…"
                        value={reviewForm.image_url}
                        onChange={(e) =>
                          setReviewForm({ ...reviewForm, image_url: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                    <input
                      ref={reviewFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleReviewFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <button
                  disabled={savingReview}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary font-semibold text-accent-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  {savingReview ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                      Publishing…
                    </span>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" /> Publish Review
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusMenu({
  current,
  onUpdate,
}: {
  current: string;
  onUpdate: (status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center gap-1.5 w-full  bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/70 active:bg-secondary/70 transition-all"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            statusConfig[current]?.dot || "bg-muted-foreground"
          }`}
        />
        <span className="truncate">{statusConfig[current]?.label || current}</span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="mt-1.5  bg-card p-1.5 shadow-lg shadow-foreground/10">
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onUpdate(key);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                current === key
                  ? "bg-accent/10 text-accent font-semibold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
              {config.label}
              {current === key && <span className="ml-auto text-[10px] opacity-70">Current</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
