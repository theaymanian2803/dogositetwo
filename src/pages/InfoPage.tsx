import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { infoPages } from "@/lib/infoPages";
import { useSettings } from "@/hooks/useSettings";

export default function InfoPage() {
  const { page } = useParams<{ page: string }>();
  const { settings } = useSettings();
  const info = infoPages.find((p) => p.slug === page);

  useEffect(() => {
    if (info) document.title = `${info.title} — ${settings.brand_name}`;
  }, [info, settings.brand_name]);

  const contactItems =
    info?.slug === "contact"
      ? [
          { label: "Email", value: settings.contact_email, icon: Mail },
          { label: "Phone", value: settings.contact_phone, icon: Phone },
          { label: "Visit us", value: settings.contact_address, icon: MapPin },
          { label: "Support hours", value: settings.support_hours, icon: Clock },
        ]
      : undefined;

  if (!info) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h1 className="text-3xl font-bold">Page not found</h1>
          <Link to="/" className="mt-4 inline-block text-accent hover:underline">
            ← Back to store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-accent">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{info.title}</span>
        </nav>

        {/* Hero */}
        <header className="relative overflow-hidden rounded-2xl bg-hero px-8 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-promo/40 blur-2xl" />
          <div className="relative">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              {info.eyebrow}
            </span>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
              {info.title}
            </h1>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">
              {info.subtitle}
            </p>
            <div className="mx-auto mt-6 grid h-14 w-14 place-items-center rounded-2xl bg-accent/10">
              <info.icon className="h-7 w-7 text-accent" />
            </div>
          </div>
        </header>

        {/* Sections */}
        <div className="mt-10 space-y-6">
          {info.sections.map((s) => (
            <section key={s.heading} className="rounded-2xl bg-card shadow-sm p-7 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10">
                  <s.icon className="h-5 w-5 text-accent" />
                </div>
                <h2 className="font-display text-xl font-bold tracking-tight">{s.heading}</h2>
              </div>
              <div className="mt-4 space-y-3">
                {s.body.map((p) => (
                  <p key={p} className="leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
              {s.list && (
                <ul className="mt-5 space-y-2.5">
                  {s.list.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {s.items && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {(contactItems ?? s.items).map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start gap-3 rounded-2xl bg-secondary p-4"
                    >
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/10">
                        <item.icon className="h-4 w-4 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-foreground">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {info.slug === "contact" && (
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-white transition-transform hover:scale-105"
                >
                  <Mail className="h-4 w-4" /> Email us
                </a>
              )}
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
