import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Lock,
  PawPrint,
  Settings,
  X,
} from "lucide-react";
import { markOnboardingDone } from "@/lib/onboarding";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface Step {
  selector?: string;
  route?: string;
  icon: ReactNode;
  title: string;
  description: string;
}

const DEMO_EMAIL = "admin@gmail.com";
const DEMO_PASSWORD = "admin123";

const STEPS: Step[] = [
  {
    icon: <PawPrint className="h-5 w-5" />,
    title: "Welcome to PetPals",
    description:
      "This tour gets your store ready to sell: sign in to the admin, connect your own database, and secure your admin login. It takes about a minute.",
  },
  {
    selector: '[data-tour="admin-signin"]',
    route: "/auth",
    icon: <Lock className="h-5 w-5" />,
    title: "Sign in to the admin",
    description:
      "The admin panel runs your whole store — products, categories, orders and settings. The demo credentials are filled in below; just click Sign in.",
  },
  {
    selector: '[data-tour="admin-dashboard"]',
    route: "/admin",
    icon: <LayoutDashboard className="h-5 w-5" />,
    title: "Your dashboard",
    description:
      "Everything you need to run the store lives here — products, categories, reviews and orders. Press Next and we'll open Settings.",
  },
  {
    selector: '[data-tour="nav-settings"]',
    route: "/admin",
    icon: <Settings className="h-5 w-5" />,
    title: "Open Settings",
    description:
      "Settings is where you connect your own database and secure your admin login. Click it, or press Next and we'll take you straight there.",
  },
  {
    selector: '[data-tour="admin-db"]',
    route: "/admin?tab=settings",
    icon: <Database className="h-5 w-5" />,
    title: "Connect your own database",
    description:
      "The template runs on a shared demo database. Click Connect your database to attach your own free Turso database — your data and customers stay private.",
  },
  {
    selector: '[data-tour="admin-creds"]',
    route: "/admin?tab=settings",
    icon: <KeyRound className="h-5 w-5" />,
    title: "Secure your admin login",
    description:
      "Once your own database is connected you can change the admin email and password here. On the demo database these are shared, so they stay read-only.",
  },
  {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: "You're ready",
    description:
      "Your store is set up. Everything else — branding, products and categories — is customized right from this admin panel. Happy selling!",
  },
];

const TOOLTIP_WIDTH = 336;
const TOOLTIP_HEIGHT = 224;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: string;
}

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingDialog({ open, onOpenChange }: OnboardingDialogProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const signingIn = useRef(false);
  const scrollDoneFor = useRef<string | null>(null);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const waiting = !!current.selector && rect === null;

  useEffect(() => {
    if (!open) return;
    setStep(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const current = STEPS[step];
    const here = location.pathname + location.search;
    const hasSession = !!localStorage.getItem("session");
    if (hasSession) signingIn.current = false;
    if (current.route === "/auth" && hasSession && step < 2) {
      setStep(2);
      return;
    }
    if (!current.route) return;
    const route = current.route;
    if (here === route) return;
    if (route.startsWith("/admin") && !hasSession) {
      if (!signingIn.current) {
        signingIn.current = true;
        signIn(DEMO_EMAIL, DEMO_PASSWORD)
          .then(() => navigate(route))
          .catch(() => {
            signingIn.current = false;
          });
      }
      return;
    }
    navigate(route);
  }, [open, step, location.pathname, location.search, navigate, signIn]);

  useEffect(() => {
    if (!open || step !== 1) return;
    if (location.pathname !== "/auth") return;
    const root = document.querySelector<HTMLElement>('[data-tour="admin-signin"]');
    if (!root) return;
    const emailInput = root.querySelector<HTMLInputElement>('input[type="email"]');
    const passInput = root.querySelector<HTMLInputElement>('input[type="password"]');
    if (!emailInput || !passInput || emailInput.value) return;
    const setValue = (el: HTMLInputElement, v: string) => {
      const proto = Object.getPrototypeOf(el);
      const desc = Object.getOwnPropertyDescriptor(proto, "value");
      desc?.set?.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    };
    setValue(emailInput, DEMO_EMAIL);
    setValue(passInput, DEMO_PASSWORD);
  }, [open, step, location.pathname]);

  const measure = useCallback(() => {
    if (!open) return;
    const sel = STEPS[step].selector;
    if (!sel) {
      setRect(null);
      return;
    }
    const el = document.querySelector<HTMLElement>(sel);
    if (!el) {
      setRect(null);
      return;
    }
    const key = `${step}:${sel}`;
    if (scrollDoneFor.current !== key) {
      scrollDoneFor.current = key;
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
      radius: cs.borderRadius,
    });
  }, [open, step]);

  useLayoutEffect(() => {
    measure();
    const observer = new MutationObserver(measure);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  useEffect(() => {
    if (!open) return;
    const el = STEPS[step].selector
      ? document.querySelector<HTMLElement>(STEPS[step].selector)
      : null;
    el?.scrollIntoView({ block: "nearest" });
  }, [open, step]);

  if (!open) return null;

  const handleClose = () => {
    markOnboardingDone();
    onOpenChange(false);
  };

  const placeBelow =
    rect !== null && rect.top + rect.height + TOOLTIP_HEIGHT + 24 <= window.innerHeight;
  const tooltipLeft = rect
    ? Math.min(
        Math.max(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, 16),
        window.innerWidth - TOOLTIP_WIDTH - 16,
      )
    : 16;
  const tooltipTop = rect
    ? Math.min(
        Math.max(placeBelow ? rect.top + rect.height + 24 : rect.top - TOOLTIP_HEIGHT - 24, 16),
        window.innerHeight - TOOLTIP_HEIGHT - 16,
      )
    : 16;

  const isAboveViewport = rect !== null && rect.top < 0;
  const isBelowViewport = rect !== null && rect.top + rect.height > window.innerHeight;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-label="Welcome tour">
      {!rect && <div className="pointer-events-none absolute inset-0 bg-black/60" />}

      {rect && (
        <div
          data-tour-spotlight
          className="absolute pointer-events-none transition-all duration-300"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: rect.radius,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
          }}
        />
      )}

      {rect && (isAboveViewport || isBelowViewport) && (
        <div
          className="pointer-events-none absolute left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5"
          style={isAboveViewport ? { top: 20 } : { bottom: 20 }}
        >
          {isBelowViewport ? (
            <ChevronDown className="h-7 w-7 animate-bounce text-accent" />
          ) : (
            <ChevronUp className="h-7 w-7 animate-bounce text-accent" />
          )}
          <span className="rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-lg">
            {isBelowViewport ? "Scroll down to see it" : "Scroll up to see it"}
          </span>
        </div>
      )}

      <div
        className="absolute z-10 rounded-2xl border border-border/50 bg-card text-card-foreground shadow-2xl pointer-events-auto"
        style={{ width: TOOLTIP_WIDTH, left: tooltipLeft, top: tooltipTop }}
      >
        <div
          className={`absolute h-3 w-3 rotate-45 border-border/50 bg-card ${
            placeBelow ? "-top-1.5 border-t border-l" : "-bottom-1.5 border-b border-r"
          }`}
          style={{
            left: Math.min(
              Math.max(rect ? rect.left + rect.width / 2 - 6 : 16, 20),
              TOOLTIP_WIDTH - 26,
            ),
          }}
        />

        <button
          onClick={handleClose}
          aria-label="Skip tour"
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
              {current.icon}
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {step + 1} / {STEPS.length}
            </span>
            <div className="flex items-center gap-1">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-5 bg-primary" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold leading-snug">{current.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{current.description}</p>
          </div>

          {waiting && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              Waiting — finish the previous step and this page will appear.
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Back
            </Button>
            {isLast ? (
              <Button size="sm" onClick={handleClose} className="text-sm font-semibold">
                Finish
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="text-sm font-semibold"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
