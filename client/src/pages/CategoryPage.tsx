import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowUpRight, MessageCircle, Plus, Sparkles } from "lucide-react";
import CommunityLayout from "@/components/CommunityLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

function timeLabel(value: Date | string) {
  const hours = Math.round((Date.now() - new Date(value).getTime()) / 36e5);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function CategoryPage() {
  const { user } = useAuth();
  const { slug = "" } = useParams<{ slug: string }>();
  const categoriesQuery = trpc.community.categories.useQuery(undefined, { enabled: Boolean(user) });
  const category = categoriesQuery.data?.find(item => item.slug === slug);
  const postsQuery = trpc.community.posts.list.useQuery({ categoryId: category?.id }, { enabled: Boolean(user && category) });
  if (!user) return <CommunityLayout><div /></CommunityLayout>;
  return <CommunityLayout><div className="mx-auto max-w-5xl space-y-7"><Link href="/categories" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-cyan-300"><ArrowLeft className="h-4 w-4" />All categories</Link>{category ? <><section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-indigo-500/15 to-cyan-300/5 p-7 sm:p-9"><div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><Badge className="rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">Category</Badge><h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-white">{category.name}</h1><p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">{category.description}</p></div><Link href="/"><Button className="rounded-full bg-white text-slate-950 hover:bg-cyan-100"><Plus className="mr-2 h-4 w-4" />Start a discussion</Button></Link></div><div className="mt-7 flex flex-wrap gap-3 text-xs text-slate-500"><span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2">{category.postCount} posts in this space</span><span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2">Member-only conversation</span></div></section><section className="space-y-3"><div className="flex items-center justify-between"><div><p className="eyebrow">The conversation</p><h2 className="mt-2 text-2xl font-semibold text-white">Recent discussions</h2></div><Sparkles className="h-5 w-5 text-cyan-300" /></div>{postsQuery.isLoading ? <div className="h-32 animate-pulse rounded-2xl border border-white/8 bg-white/[.035]" /> : postsQuery.data?.length ? postsQuery.data.map(post => <Link key={post.id} href={`/discussion/${post.id}`} className="topic-row group"><div className="topic-icon"><MessageCircle className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2">{post.acceptedReplyId && <Badge className="rounded-full border border-emerald-300/20 bg-emerald-300/10 text-[10px] text-emerald-200">Solved</Badge>}</div><h3 className="mt-2 truncate text-base font-semibold text-white group-hover:text-cyan-200">{post.title}</h3><p className="mt-1 line-clamp-1 text-sm text-slate-500">{post.body}</p><p className="mt-3 text-xs text-slate-600">{post.authorName || "Member"} · {timeLabel(post.updatedAt)}</p></div><div className="hidden items-center gap-4 text-xs text-slate-500 sm:flex"><span>{post.replyCount} replies</span><span>{post.viewCount} views</span><ArrowUpRight className="h-4 w-4 text-slate-700 group-hover:text-cyan-300" /></div></Link>) : <Card className="premium-card"><CardContent className="p-8 text-center"><MessageCircle className="mx-auto h-7 w-7 text-cyan-300" /><p className="mt-3 font-semibold text-white">No discussions here yet.</p><p className="mt-1 text-sm text-slate-500">Be the member who gives this category its first signal.</p></CardContent></Card>}</section></> : <Card className="premium-card"><CardContent className="p-10 text-center"><p className="text-lg font-semibold text-white">Category not found</p><p className="mt-2 text-sm text-slate-500">Return to all categories and choose another space.</p></CardContent></Card>}</div></CommunityLayout>;
}
