import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { BookOpen, ChevronDown, Compass, FileQuestion, Flame, Group, LifeBuoy, Mail, Menu, MessageSquare, MoreHorizontal, Settings2, ShieldCheck, Sparkles, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";

const docsUrl = "https://jennymahmuda.github.io/Smartgen-Nexuses-Lead-Collector/";

function EmailLoginDialog({ triggerLabel = "Sign in with email", size = "default" as const }: { triggerLabel?: string; size?: "default" | "lg" }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const requestLogin = trpc.auth.requestEmailLogin.useMutation();
  useEffect(() => {
    const openForAuth = () => setOpen(true);
    window.addEventListener("smartgen:auth-required", openForAuth);
    return () => window.removeEventListener("smartgen:auth-required", openForAuth);
  }, []);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    requestLogin.mutate({ email: email.trim() });
  };
  return <>
    <Button size={size} onClick={() => setOpen(true)} className={size === "lg" ? "rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 px-7 text-slate-950 shadow-[0_14px_50px_rgba(41,203,225,.2)] hover:from-indigo-400 hover:to-cyan-300" : "rounded-full bg-white px-5 text-sm font-semibold text-slate-950 hover:bg-cyan-100"}>
      <Mail className="mr-2 h-4 w-4" />{triggerLabel}
    </Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="border-white/10 bg-[#11152b] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-cyan-300" />Email sign-in</DialogTitle>
          <DialogDescription className="text-slate-400">We’ll send a secure one-time link. No password is needed, and the link expires after 15 minutes.</DialogDescription>
        </DialogHeader>
        {requestLogin.isSuccess ? <div className="space-y-4"><div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-100">Check <strong>{email}</strong> for your SmartGen Community sign-in link. You can close this window after opening the email.</div><Button type="button" onClick={() => { requestLogin.reset(); setEmail(""); }} className="w-full rounded-xl bg-white text-slate-950 hover:bg-cyan-100">Use another email</Button></div> : <form onSubmit={submit} className="space-y-5"><div><Label htmlFor="community-email" className="text-slate-300">Email address</Label><Input id="community-email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-slate-600" /></div>{requestLogin.error && <p className="text-sm text-rose-300">{requestLogin.error.message}</p>}<Button disabled={requestLogin.isPending || !email.trim()} className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 font-semibold text-slate-950 hover:from-indigo-400 hover:to-cyan-300">{requestLogin.isPending ? "Sending secure link…" : "Send sign-in link"}</Button><p className="text-center text-xs text-slate-500">Prefer the existing Manus login? <button type="button" onClick={() => startLogin()} className="font-semibold text-cyan-300 hover:text-cyan-200">Continue with Manus</button></p></form>}
      </DialogContent>
    </Dialog>
  </>;
}

function initials(name?: string | null, email?: string | null) {
  const value = name || email || "SmartGen";
  return value
    .split(" ")
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
}

export function LoginPrompt() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070814] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(113,89,255,.28),transparent_34%),radial-gradient(circle_at_85%_70%,rgba(35,207,222,.18),transparent_32%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link href="/" className="flex items-center gap-3">
            <img src="https://raw.githubusercontent.com/bayzed123/SmartGenQR.oi/main/assets/img/logo-icon.svg" alt="SmartGen" className="h-9 w-9 object-contain" />
            <span className="text-lg font-bold tracking-tight">Smart<span className="text-cyan-300">Gen</span></span>
          </Link>
          <EmailLoginDialog />
        </header>
        <section className="grid flex-1 items-center gap-12 py-20 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <Badge className="mb-6 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-1 text-cyan-200">A private space for SmartGen builders</Badge>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-7xl">The community layer for people building what’s next.</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">Ask better questions, share proven workflows, and find the contributors who turn hard problems into clear solutions.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <EmailLoginDialog triggerLabel="Enter the community" size="lg" />
              <a href={docsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/50 hover:text-cyan-200"><BookOpen className="h-4 w-4" /> Developer docs</a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-10 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-white/[.055] p-5 shadow-2xl backdrop-blur-xl">
              <div className="rounded-[1.4rem] border border-white/10 bg-[#0f1328]/90 p-5">
                <div className="mb-5 flex items-center justify-between"><span className="text-xs uppercase tracking-[.22em] text-cyan-200">Member pulse</span><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_#34d399]" /></div>
                <div className="space-y-4">
                  {["Support that respects your time", "Documentation that stays close", "Recognition for useful work"].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[.035] p-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-400/30 to-cyan-300/20 text-cyan-200">0{index + 1}</span><span className="text-sm text-slate-200">{item}</span></div>)}
                </div>
              </div>
            </div>
          </div>
        </section>
        <footer className="border-t border-white/10 py-5 text-xs text-slate-500">SmartGen Community · private by design · powered by thoughtful builders</footer>
      </div>
    </main>
  );
}

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [location] = useLocation();
  const categories = trpc.community.categories.useQuery(undefined, { enabled: Boolean(user) });
  const profileQuery = trpc.community.profile.get.useQuery({ userId: user?.id ?? 0 }, { enabled: Boolean(user) });

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#070814] text-cyan-200"><div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300" /></div>;
  if (!user) return <LoginPrompt />;

  const primary = [
    { href: "/", label: "Topics", icon: MessageSquare },
    { href: "/categories", label: "Categories", icon: Compass },
    { href: "/groups", label: "Groups", icon: Group },
    { href: "/guidelines", label: "Guidelines", icon: FileQuestion },
  ];
  const moreCategories = (categories.data ?? []).filter(category => !["general-discussion", "support", "announcements", "documentation", "guides"].includes(category.slug));
  const isActive = (href: string) => href === "/" ? location === "/" : location.startsWith(href);

  return (
    <div className="min-h-screen bg-[#070814] text-slate-100">
      <div className="pointer-events-none fixed inset-0 opacity-80" style={{ background: "radial-gradient(circle at 82% 2%, rgba(79,70,229,.17), transparent 27rem), radial-gradient(circle at 4% 70%, rgba(6,182,212,.09), transparent 25rem)" }} />
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#080a18]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-[1500px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" className="text-slate-300 lg:hidden" onClick={() => setMobileOpen(value => !value)} aria-label="Toggle navigation">{mobileOpen ? <X /> : <Menu />}</Button>
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <img src="https://raw.githubusercontent.com/bayzed123/SmartGenQR.oi/main/assets/img/logo-icon.svg" alt="SmartGen" className="h-9 w-9 object-contain" />
            <span className="hidden text-base font-bold tracking-tight sm:block">Smart<span className="text-cyan-300">Gen</span> <span className="font-medium text-slate-500">Community</span></span>
          </Link>
          <nav className="ml-5 hidden items-center gap-1 lg:flex">
            {primary.map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} className={`nav-link ${isActive(item.href) ? "nav-link-active" : ""}`}><Icon className="h-4 w-4" />{item.label}</Link>; })}
            <div className="relative">
              <button type="button" onClick={() => setMoreOpen(value => !value)} className={`nav-link ${moreOpen ? "nav-link-active" : ""}`}><MoreHorizontal className="h-4 w-4" />More<ChevronDown className="h-3.5 w-3.5" /></button>
              {moreOpen && <div className="absolute left-0 top-12 z-50 w-64 rounded-2xl border border-white/10 bg-[#11152b] p-2 shadow-2xl">
                {moreCategories.length ? moreCategories.map(category => <Link key={category.slug} href={`/category/${category.slug}`} onClick={() => setMoreOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/8 hover:text-white"><span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-400/10 text-indigo-200">✦</span>{category.name}</Link>) : <p className="px-3 py-2 text-sm text-slate-500">More categories are loading.</p>}
              </div>}
            </div>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <a href={docsUrl} target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-full border border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-200 sm:inline-flex"><BookOpen className="h-3.5 w-3.5" /> Docs</a>
            <Link href={`/profile/${user.id}`} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] py-1.5 pl-1.5 pr-3 transition hover:border-cyan-300/30"><Avatar className="h-8 w-8 border border-cyan-300/20"><AvatarFallback className="bg-gradient-to-br from-indigo-500 to-cyan-400 text-xs font-bold text-slate-950">{initials(user.name, user.email)}</AvatarFallback></Avatar><span className="hidden max-w-28 truncate text-sm font-medium text-slate-200 md:block">{user.name || "Member"}</span>{profileQuery.data?.stats.ratingCount ? <span className="rating-badge">★ {(profileQuery.data.stats.ratingScore / 10).toFixed(1)}</span> : null}</Link>
            <Button variant="ghost" size="sm" onClick={() => logout()} className="hidden text-slate-400 hover:bg-white/8 hover:text-white sm:inline-flex">Sign out</Button>
          </div>
        </div>
      </header>
      <div className="relative mx-auto grid max-w-[1500px] grid-cols-1 lg:grid-cols-[15.5rem_minmax(0,1fr)]">
        <aside className={`${mobileOpen ? "block" : "hidden"} border-b border-white/8 bg-[#090b1b]/90 px-4 py-5 lg:block lg:min-h-[calc(100vh-4.5rem)] lg:border-b-0 lg:border-r lg:px-5 lg:py-8`}>
          <div className="mb-8 rounded-2xl border border-indigo-300/10 bg-gradient-to-br from-indigo-500/15 to-cyan-300/5 p-4"><p className="text-[10px] font-bold uppercase tracking-[.24em] text-cyan-200">Community pulse</p><p className="mt-2 text-sm leading-6 text-slate-300">A focused place to ask, learn, and give back.</p><div className="mt-4 flex items-center gap-2 text-xs text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Private members area</div></div>
          <div className="space-y-1">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Explore</p>
            <Link href="/" className={`side-link ${isActive("/") ? "side-link-active" : ""}`}><Flame className="h-4 w-4" />Latest topics</Link>
            <Link href="/categories" className={`side-link ${isActive("/categories") ? "side-link-active" : ""}`}><Compass className="h-4 w-4" />All categories</Link>
            <Link href="/contributors" className={`side-link ${isActive("/contributors") ? "side-link-active" : ""}`}><Sparkles className="h-4 w-4" />Top contributors</Link>
            {user.role === "admin" && <Link href="/admin/categories" className={`side-link ${isActive("/admin/categories") ? "side-link-active" : ""}`}><Settings2 className="h-4 w-4" />Manage categories</Link>}
          </div>
          <div className="mt-8 space-y-1">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Documentation</p>
            <a href={docsUrl} target="_blank" rel="noreferrer" className="side-link"><BookOpen className="h-4 w-4 text-cyan-300" />NexusLeads docs</a>
            <a href={`${docsUrl}api/`} target="_blank" rel="noreferrer" className="side-link"><LifeBuoy className="h-4 w-4 text-indigo-300" />API reference</a>
          </div>
          <div className="mt-8 rounded-2xl border border-white/8 bg-white/[.03] p-4"><p className="text-xs font-semibold text-slate-200">Need a hand?</p><p className="mt-1 text-xs leading-5 text-slate-500">Start in Support and include the exact step where you got blocked.</p><Link href="/category/support" className="mt-3 inline-flex text-xs font-semibold text-cyan-300 hover:text-cyan-200">Visit Support →</Link></div>
        </aside>
        <main className="min-w-0 px-4 py-7 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
