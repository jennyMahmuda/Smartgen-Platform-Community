import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, BookOpen, ChevronRight, Compass, MessageCircle, Plus, Sparkles, TrendingUp, Users } from "lucide-react";
import CommunityLayout from "@/components/CommunityLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

function initials(name?: string | null) {
  return (name || "SG").split(" ").slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function timeLabel(value: Date | string) {
  const date = new Date(value);
  const hours = Math.round((Date.now() - date.getTime()) / 36e5);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function NewDiscussion({ categories }: { categories: Array<{ id: number; name: string }> }) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const utils = trpc.useUtils();
  const createPost = trpc.community.posts.create.useMutation({ onSuccess: () => { setOpen(false); setTitle(""); setBody(""); setCategoryId(""); utils.community.posts.list.invalidate(); utils.community.categories.invalidate(); } });
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (!categoryId) return; createPost.mutate({ categoryId: Number(categoryId), title, body }); };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 font-semibold text-slate-950 shadow-lg shadow-cyan-500/10 hover:from-indigo-400 hover:to-cyan-300"><Plus className="mr-2 h-4 w-4" />Start a discussion</Button></DialogTrigger><DialogContent className="border-white/10 bg-[#11152b] text-white sm:max-w-xl"><DialogHeader><DialogTitle>Start a thoughtful discussion</DialogTitle><DialogDescription className="text-slate-400">Ask clearly, add context, and make it easier for the right contributor to help.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-5"><div><Label className="text-slate-300">Category</Label><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger className="mt-2 border-white/10 bg-white/5 text-white"><SelectValue placeholder="Choose a category" /></SelectTrigger><SelectContent className="border-white/10 bg-[#151a34] text-white">{categories.map(category => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}</SelectContent></Select></div><div><Label className="text-slate-300">Title</Label><Input value={title} onChange={event => setTitle(event.target.value)} className="mt-2 border-white/10 bg-white/5 text-white" placeholder="What do you want to solve?" minLength={8} /></div><div><Label className="text-slate-300">Details</Label><Textarea value={body} onChange={event => setBody(event.target.value)} className="mt-2 min-h-32 border-white/10 bg-white/5 text-white" placeholder="Share context, what you tried, and what a useful answer would look like." minLength={20} /></div>{createPost.error && <p className="text-sm text-rose-300">{createPost.error.message}</p>}<Button disabled={createPost.isPending || !categoryId} className="w-full rounded-xl bg-white text-slate-950 hover:bg-cyan-100">{createPost.isPending ? "Publishing…" : "Publish discussion"}</Button></form></DialogContent></Dialog>;
}

export default function Home() {
  const { user, loading } = useAuth();
  const categoriesQuery = trpc.community.categories.useQuery(undefined, { enabled: Boolean(user) });
  const postsQuery = trpc.community.posts.list.useQuery(undefined, { enabled: Boolean(user) });
  const contributorsQuery = trpc.community.contributors.list.useQuery(undefined, { enabled: Boolean(user) });
  const categories = categoriesQuery.data ?? [];
  const posts = postsQuery.data ?? [];
  const contributors = contributorsQuery.data ?? [];
  const featured = useMemo(() => categories.slice(0, 5), [categories]);

  if (loading || !user) return <CommunityLayout><div /></CommunityLayout>;

  return <CommunityLayout>
    <div className="mx-auto max-w-6xl space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-indigo-500/20 via-[#11152b] to-cyan-400/10 p-7 shadow-2xl sm:p-10">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div><Badge className="rounded-full border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">SmartGen Platform Community</Badge><h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-white sm:text-6xl">Build in public. <span className="text-gradient">Learn in community.</span></h1><p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">A private, signal-rich space for builders using SmartGen to ask precise questions, share real workflows, and recognize the people who make progress easier.</p></div><NewDiscussion categories={categories} /></div>
        <div className="relative mt-9 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3"><div className="stat-chip"><MessageCircle className="h-4 w-4 text-cyan-300" /><span><strong>{posts.length}</strong> active topics</span></div><div className="stat-chip"><Users className="h-4 w-4 text-indigo-300" /><span><strong>{contributors.length}</strong> featured contributors</span></div><div className="stat-chip"><TrendingUp className="h-4 w-4 text-emerald-300" /><span><strong>Private</strong> member space</span></div></div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="space-y-6"><div className="section-heading"><div><p className="eyebrow">The signal</p><h2>Latest topics</h2></div><Link href="/categories" className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-300 hover:text-cyan-200">Browse categories <ArrowUpRight className="h-4 w-4" /></Link></div>
          {postsQuery.isLoading ? <div className="space-y-3">{[1, 2, 3].map(item => <div key={item} className="h-28 animate-pulse rounded-2xl border border-white/8 bg-white/[.035]" />)}</div> : posts.length ? <div className="space-y-3">{posts.map(post => <Link key={post.id} href={`/discussion/${post.id}`} className="topic-row group"><div className="topic-icon"><MessageCircle className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge className="rounded-full border border-indigo-300/15 bg-indigo-300/10 text-[10px] font-semibold text-indigo-200">{post.categoryName}</Badge>{post.acceptedReplyId && <Badge className="rounded-full border border-emerald-300/20 bg-emerald-300/10 text-[10px] text-emerald-200">Solved</Badge>}</div><h3 className="mt-2 truncate text-base font-semibold text-slate-100 transition group-hover:text-cyan-200">{post.title}</h3><p className="mt-1 line-clamp-1 text-sm text-slate-500">{post.body}</p><p className="mt-3 text-xs text-slate-600">{post.authorName || "Member"} · {timeLabel(post.updatedAt)} · {post.viewCount} views</p></div><div className="hidden items-center gap-4 text-xs text-slate-500 sm:flex"><span>{post.replyCount} replies</span><span>{post.reactionCount} likes</span><ChevronRight className="h-4 w-4 text-slate-700 transition group-hover:translate-x-1 group-hover:text-cyan-300" /></div></Link>)}</div> : <div className="empty-state"><Sparkles className="h-6 w-6 text-cyan-300" /><p>No discussions yet. Start the first useful thread.</p></div>}
        </section>
        <aside className="space-y-7"><Card className="premium-card"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><Compass className="h-4 w-4 text-cyan-300" />Explore spaces</CardTitle></CardHeader><CardContent className="space-y-2">{featured.map(category => <Link key={category.slug} href={`/category/${category.slug}`} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/6 hover:text-white"><span>{category.name}</span><span className="text-xs text-slate-600">{category.postCount}</span></Link>)}<Link href="/categories" className="mt-2 flex items-center gap-2 border-t border-white/8 px-3 pt-4 text-xs font-semibold text-cyan-300">View all categories <ArrowUpRight className="h-3.5 w-3.5" /></Link></CardContent></Card><Card className="premium-card"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><Sparkles className="h-4 w-4 text-amber-300" />Top contributors</CardTitle></CardHeader><CardContent className="space-y-4">{contributors.length ? contributors.slice(0, 4).map(contributor => <Link key={contributor.userId} href={`/profile/${contributor.userId}`} className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-cyan-300 text-xs font-bold text-slate-950">{initials(contributor.name)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-200">{contributor.name || "Member"}</p><p className="text-xs text-slate-500">{contributor.solutionsProvided} solutions</p></div>{contributor.ratingCount > 0 ? <span className="rating-badge">★ {(Number(contributor.ratingScore || 0) / 10).toFixed(1)}</span> : null}</Link>) : <p className="text-sm text-slate-500">Your helpful work will appear here.</p>}</CardContent></Card><Card className="premium-card bg-gradient-to-br from-indigo-500/10 to-cyan-300/5"><CardContent className="p-5"><BookOpen className="h-5 w-5 text-cyan-300" /><h3 className="mt-4 font-semibold text-white">Keep the docs close</h3><p className="mt-2 text-sm leading-6 text-slate-400">Browse the full NexusLeads API reference and implementation guides.</p><a href="https://jennymahmuda.github.io/Smartgen-Nexuses-Lead-Collector/" target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-semibold text-cyan-300">Open documentation →</a></CardContent></Card></aside>
      </div>
    </div>
  </CommunityLayout>;
}
