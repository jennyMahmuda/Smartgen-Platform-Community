import { ArrowUpRight, BookOpen, Compass, MessageSquare, Sparkles } from "lucide-react";
import { Link } from "wouter";
import CommunityLayout from "@/components/CommunityLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const required = new Set(["General Discussion", "Support", "Announcements", "Documentation", "Guides"]);

export default function CategoriesPage() {
  const { user } = useAuth();
  const query = trpc.community.categories.useQuery(undefined, { enabled: Boolean(user) });
  const categories = query.data ?? [];
  const primary = categories.filter(category => required.has(category.name));
  const more = categories.filter(category => !required.has(category.name));
  if (!user) return <CommunityLayout><div /></CommunityLayout>;
  return <CommunityLayout><div className="mx-auto max-w-6xl space-y-8"><div className="max-w-3xl"><p className="eyebrow">Find your room</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">All community categories</h1><p className="mt-4 text-base leading-7 text-slate-400">Start with a familiar space or explore a focused track. Every category keeps conversations close to the context that makes answers useful.</p></div><section><div className="mb-4 flex items-center gap-2"><Compass className="h-4 w-4 text-cyan-300" /><h2 className="text-lg font-semibold text-white">Core spaces</h2></div><div className="grid gap-4 md:grid-cols-2">{primary.map(category => <CategoryCard key={category.id} category={category} featured />)}</div></section><section><div className="mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-300" /><h2 className="text-lg font-semibold text-white">More from the community</h2></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{more.map(category => <CategoryCard key={category.id} category={category} />)}</div></section><Card className="premium-card"><CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-white">Need a place for a new idea?</p><p className="mt-1 text-sm text-slate-500">Start a topic from the home feed and choose the closest category.</p></div><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">Open topics <ArrowUpRight className="h-4 w-4" /></Link></CardContent></Card></div></CommunityLayout>;
}

function CategoryCard({ category, featured = false }: { category: { id: number; slug: string; name: string; description: string; postCount: number; icon: string | null }; featured?: boolean }) {
  return <Link href={`/category/${category.slug}`} className="group"><Card className={`premium-card h-full transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/25 ${featured ? "bg-gradient-to-br from-white/[.07] to-indigo-400/[.06]" : ""}`}><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200"><MessageSquare className="h-5 w-5" /></span><Badge className="rounded-full border border-white/10 bg-white/5 text-xs text-slate-400">{category.postCount} posts</Badge></div><h3 className="mt-5 text-lg font-semibold text-white transition group-hover:text-cyan-200">{category.name}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{category.description}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 group-hover:text-cyan-300">Explore space <ArrowUpRight className="h-3.5 w-3.5" /></span></CardContent></Card></Link>;
}
