import { getSession } from "@/lib/auth/session";
import { BRAND } from "@/lib/marketing";
import { CalendarCheck, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

/*
 * Wiseworx-branded auth shell (cal.wiseworx.net). The brand panel uses the
 * Wiseworx palette from wiseworx.net as fixed colors on purpose: it is the
 * brand surface and looks the same in light and dark. The form panel uses the
 * app tokens, re-tinted by the `.ww-auth` scope in globals.css.
 */

const HIGHLIGHTS = [
  { icon: CalendarCheck, text: "Google Calendar synced in real time" },
  { icon: Clock, text: "Bookings, reminders and follow-ups handled for you" },
  { icon: ShieldCheck, text: "Self-hosted in the EU, private by design" },
];

function WiseworxLogo({ size }: { size: number }) {
  return (
    <img
      src="/brand/wiseworx-logo.png"
      alt=""
      aria-hidden
      width={size}
      height={Math.round(size * 0.973)}
      className="block shrink-0"
    />
  );
}

function Wordmark({ size, compact = false }: { size: number; compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <WiseworxLogo size={size} />
      <span className={compact ? "text-[19px] font-semibold" : "text-[22px] font-semibold"}>
        Wiseworx
      </span>
      <span className="rounded-full border border-[#2E2736] px-2.5 py-1 font-mono text-[11px] tracking-[0.06em] text-[#B9AEBB]">
        CALENDAR
      </span>
    </span>
  );
}

export default async function AuthLayout({ children }: { children: ReactNode }) {
  // Already signed in? Skip the auth screens entirely.
  const session = await getSession();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="ww-auth grid min-h-screen bg-[var(--color-bg)] lg:grid-cols-[7fr_5fr]">
      {/* Brand panel - desktop. */}
      <aside className="ww-grid relative hidden flex-col justify-between overflow-hidden bg-[#15111A] px-[72px] py-14 text-[#F3EEE8] lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[180px] -bottom-[200px] h-[640px] w-[640px] rounded-full"
          style={{
            background: "radial-gradient(closest-side, rgba(238,155,69,0.16), rgba(238,155,69,0))",
          }}
        />

        <div className="relative">
          <Wordmark size={44} />
        </div>

        <div className="relative flex max-w-[600px] flex-col gap-7">
          <span className="font-mono text-[13px] tracking-[0.14em] text-[#EE9B45]">
            TOMÁŠ VINCE · WISEWORX
          </span>
          <h1 className="font-display text-[clamp(44px,4.2vw,60px)] leading-[1.04] font-semibold tracking-[-0.025em]">
            Scheduling that runs
            <br />
            <span className="text-[#EE9B45]">on autopilot.</span>
          </h1>
          <p className="max-w-[520px] text-lg leading-relaxed text-[#B9AEBB]">
            The private scheduling workspace of Wiseworx. Want to book a meeting? Use the booking
            link you received from Tomáš.
          </p>
          <ul className="mt-2 space-y-3.5">
            {HIGHLIGHTS.map((h) => (
              <li key={h.text} className="flex items-center gap-3.5 text-[15px]">
                <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-[#2E2736] bg-[#1E1924]">
                  <h.icon size={16} className="text-[#EE9B45]" />
                </span>
                {h.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center justify-between text-[13px] text-[#8F8494]">
          <span>© {BRAND.copyrightYear} Wiseworx · Ing. Tomáš Vince</span>
          <a href="https://wiseworx.net" className="text-[#B9AEBB] hover:text-[#F3EEE8]">
            wiseworx.net →
          </a>
        </div>
      </aside>

      {/* Form panel. */}
      <div className="relative flex flex-col">
        {/* Brand header - mobile only (the aside carries it on desktop). */}
        <header className="ww-grid flex flex-col gap-5 bg-[#15111A] px-6 pt-7 pb-8 text-[#F3EEE8] lg:hidden">
          <Wordmark size={36} compact />
          <p className="font-display text-[30px] leading-[1.08] font-semibold tracking-[-0.02em]">
            Scheduling that runs <span className="text-[#EE9B45]">on autopilot.</span>
          </p>
        </header>

        <div className="flex flex-1 flex-col px-6 py-8 sm:px-10 lg:px-[72px] lg:py-14">
          <div className="flex flex-1 items-center justify-center lg:py-8">
            <div className="w-full max-w-[380px]">{children}</div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-5 text-xs text-[var(--color-muted)]">
            <Link href="/privacy" className="hover:text-[var(--color-text)]">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[var(--color-text)]">
              Terms
            </Link>
            {/* AGPLv3: keep a link to the source of this deployment. */}
            <a
              href="https://github.com/tomique34/dayotter-wiseworx"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--color-text)]"
            >
              Powered by DayOtter · AGPLv3
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
