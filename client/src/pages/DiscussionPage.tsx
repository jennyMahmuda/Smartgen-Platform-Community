import { useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, CheckCircle2, Heart, MessageCircle, Send, ShieldCheck, Sparkles } from "lucide-react";
import CommunityLayout from "@/components/CommunityLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

function initials(name?: string | null) { return (name || "SG").split(" ").slice(0, 2).map(part => part[0]).join("").toUpperCase(); }
function authorHref(id: number) { return `/profile/${id}`; }
function RatingBadge({ score, count }: { score: number; count: number }) { return count > 0 ? <span className="rating-badge ml-1">★ {(score / 10).toFixed(1)}</span> : null; }

export default function DiscussionPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const query = trpc.community.posts.get.useQuery({ id: postId }, { enabled: Boolean(user && postId) });
  const utils = trpc.useUtils();
  const [reply, setReply] = useState("");
  const toggleReaction = trpc.community.reactions.toggle.useMutation({
    onSuccess: () => utils.community.posts.get.invalidate({ id: postId }),
    onError: error => toast.error(error.message || "We could not update that reaction."),
  });
  const createReply = trpc.community.replies.create.useMutation({
    onSuccess: () => { setReply(""); utils.community.posts.get.invalidate({ id: postId }); toast.success("Your reply was posted."); },
    onError: error => toast.error(error.message || "We could not post your reply."),
  });
  const acceptReply = trpc.community.replies.accept.useMutation({
    onSuccess: () => { utils.community.posts.get.invalidate({ id: postId }); toast.success("Solution marked for this discussion."); },
    onError: error => toast.error(error.message || "Only the discussion author can accept a solution."),
  });
  if (!user) return <CommunityLayout><div /></CommunityLayout>;
  const post = query.data?.post;
  const submitReply = (event: React.FormEvent) => { event.preventDefault(); if (reply.trim().length >= 10) createReply.mutate({ postId, body: reply }); };
  return <CommunityLayout><div className="mx-auto max-w-5xl space-y-7"><Link href={post ? `/category/${post.categorySlug}` : "/categories"} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-cyan-300"><ArrowLeft className="h-4 w-4" />Back to {post?.categoryName || "categories"}</Link>{query.isLoading ? <div className="h-72 animate-pulse rounded-[2rem] border border-white/8 bg-white/[.035]" /> : post ? <><article className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[.07] to-indigo-500/[.06]"><div className="p-7 sm:p-9"><div className="flex flex-wrap items-center gap-2"><Badge className="rounded-full border border-indigo-300/15 bg-indigo-300/10 text-indigo-200">{post.categoryName}</Badge>{post.acceptedReplyId && <Badge className="rounded-full border border-emerald-300/20 bg-emerald-300/10 text-emerald-200"><CheckCircle2 className="mr-1 h-3 w-3" />Solved</Badge>}</div><h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">{post.title}</h1><div className="mt-7 flex flex-wrap items-center gap-4"><Link href={authorHref(post.authorId)} className="flex items-center gap-3"><Avatar className="h-10 w-10 border border-cyan-300/20"><AvatarFallback className="bg-gradient-to-br from-indigo-400 to-cyan-300 text-xs font-bold text-slate-950">{initials(post.authorName)}</AvatarFallback></Avatar><div><p className="text-sm font-semibold text-white">{post.authorName || "Member"} <RatingBadge score={post.authorRatingScore} count={post.authorRatingCount} /></p><p className="text-xs text-slate-500">Discussion author</p></div></Link><div className="text-xs text-slate-600">{post.viewCount} views · {post.replyCount} replies</div></div><div className="prose-community mt-8"><p>{post.body}</p></div><div className="mt-8 flex flex-wrap gap-2"><Button variant="outline" onClick={() => toggleReaction.mutate({ targetType: "post", targetId: post.id })} className={`rounded-full border-white/10 ${query.data?.reacted ? "bg-rose-400/10 text-rose-200" : "bg-white/5 text-slate-300"}`}><Heart className="mr-2 h-4 w-4" />{post.reactionCount} helpful</Button><span className="inline-flex items-center gap-2 rounded-full border border-white/8 px-4 py-2 text-sm text-slate-500"><MessageCircle className="h-4 w-4" />{post.replyCount} responses</span></div></div></article><section className="space-y-4"><div className="flex items-center justify-between"><div><p className="eyebrow">Member responses</p><h2 className="mt-2 text-2xl font-semibold text-white">Helpful context from the community</h2></div><Sparkles className="h-5 w-5 text-cyan-300" /></div>{post.replies.length ? post.replies.map(item => <Card key={item.id} className={`premium-card ${item.isAccepted ? "border-emerald-300/30 bg-emerald-300/[.04]" : ""}`}><CardHeader className="flex-row items-start justify-between gap-4 space-y-0"><div className="flex items-center gap-3"><Avatar className="h-9 w-9 border border-white/10"><AvatarFallback className="bg-white/10 text-xs text-slate-300">{initials(item.authorName)}</AvatarFallback></Avatar><div><Link href={authorHref(item.authorId)} className="text-sm font-semibold text-white hover:text-cyan-200">{item.authorName || "Member"} <RatingBadge score={item.authorRatingScore} count={item.authorRatingCount} /></Link><p className="text-xs text-slate-600">Community contributor</p></div></div>{item.isAccepted ? <Badge className="rounded-full border border-emerald-300/20 bg-emerald-300/10 text-emerald-200"><ShieldCheck className="mr-1 h-3 w-3" />Accepted solution</Badge> : user.id === post.authorId ? <Button variant="ghost" size="sm" disabled={acceptReply.isPending} onClick={() => acceptReply.mutate({ postId: post.id, replyId: item.id })} className="text-xs text-emerald-300 hover:bg-emerald-300/10">Mark solution</Button> : null}</CardHeader><CardContent><p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">{item.body}</p><div className="mt-4 flex items-center gap-4 text-xs text-slate-600"><button type="button" onClick={() => toggleReaction.mutate({ targetType: "reply", targetId: item.id })} className="inline-flex items-center gap-1.5 transition hover:text-rose-200"><Heart className="h-3.5 w-3.5" />{item.reactionCount} helpful</button></div></CardContent></Card>) : <Card className="premium-card"><CardContent className="p-7 text-sm text-slate-500">No replies yet. Add context that helps this member move forward.</CardContent></Card>}<Card className="premium-card"><CardHeader><CardTitle className="text-base text-white">Add your perspective</CardTitle></CardHeader><CardContent><form onSubmit={submitReply} className="space-y-3"><Textarea value={reply} onChange={event => setReply(event.target.value)} className="min-h-32 border-white/10 bg-white/5 text-white" placeholder="Share what worked, what failed, or what you would try next." /><div className="flex items-center justify-between gap-3"><p className="text-xs text-slate-600">Be specific, kind, and useful.</p><Button disabled={createReply.isPending || reply.trim().length < 10} className="rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"><Send className="mr-2 h-4 w-4" />{createReply.isPending ? "Posting…" : "Post reply"}</Button></div></form></CardContent></Card></section></> : <Card className="premium-card"><CardContent className="p-10 text-center text-slate-400">This discussion could not be found.</CardContent></Card>}</div></CommunityLayout>;
}
