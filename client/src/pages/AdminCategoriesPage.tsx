import { useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Save, Settings2 } from "lucide-react";
import { Link } from "wouter";
import CommunityLayout from "@/components/CommunityLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminCategoriesPage() {
  const { user } = useAuth();
  const canManage = user?.role === "admin";
  const query = trpc.community.admin.categories.useQuery(undefined, { enabled: canManage });
  const utils = trpc.useUtils();
  const [orderedIds, setOrderedIds] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");

  useEffect(() => {
    if (query.data) setOrderedIds(query.data.map(category => category.id));
  }, [query.data]);

  const createCategory = trpc.community.admin.createCategory.useMutation({
    onSuccess: () => {
      setName(""); setSlug(""); setDescription(""); setIcon("");
      void query.refetch();
      void utils.community.categories.invalidate();
      toast.success("Category created.");
    },
    onError: error => toast.error(error.message || "Category creation failed."),
  });
  const reorderCategories = trpc.community.admin.reorderCategories.useMutation({
    onSuccess: () => { void query.refetch(); void utils.community.categories.invalidate(); toast.success("Category order saved."); },
    onError: error => toast.error(error.message || "Category order could not be saved."),
  });

  const move = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= orderedIds.length) return;
    setOrderedIds(current => {
      const next = current.slice();
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  };

  if (!user) return <CommunityLayout><div /></CommunityLayout>;
  if (!canManage) return <CommunityLayout><Card className="premium-card mx-auto max-w-2xl"><CardContent className="p-10 text-center"><Settings2 className="mx-auto h-8 w-8 text-cyan-300" /><h1 className="mt-4 text-2xl font-semibold text-white">Admin access required</h1><p className="mt-2 text-sm leading-6 text-slate-400">Category management is limited to SmartGen administrators.</p><Link href="/" className="mt-5 inline-flex text-sm font-semibold text-cyan-300">Return to community</Link></CardContent></Card></CommunityLayout>;

  const categoriesById = new Map((query.data ?? []).map(category => [category.id, category]));
  return <CommunityLayout><div className="mx-auto max-w-5xl space-y-7"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-cyan-300"><ArrowLeft className="h-4 w-4" />Back to community</Link><div><p className="eyebrow">Administration</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-white">Manage community categories</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">Create focused spaces and control their navigation order. Existing discussions remain attached to their current category.</p></div><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"><Card className="premium-card"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><ArrowUp className="h-4 w-4 text-cyan-300" />Navigation order</CardTitle></CardHeader><CardContent className="space-y-3">{query.isLoading ? <div className="h-40 animate-pulse rounded-xl bg-white/[.04]" /> : query.isError ? <p className="text-sm text-rose-300">{query.error.message}</p> : orderedIds.map((id, index) => { const category = categoriesById.get(id); if (!category) return null; return <div key={id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[.03] p-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-400/10 text-xs font-semibold text-indigo-200">{index + 1}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{category.name}</p><p className="truncate text-xs text-slate-500">/{category.slug} · {category.postCount} posts</p></div><div className="flex gap-1"><Button variant="ghost" size="icon" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move ${category.name} up`} className="h-8 w-8 text-slate-400 hover:bg-white/8 hover:text-white"><ArrowUp className="h-4 w-4" /></Button><Button variant="ghost" size="icon" disabled={index === orderedIds.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${category.name} down`} className="h-8 w-8 text-slate-400 hover:bg-white/8 hover:text-white"><ArrowDown className="h-4 w-4" /></Button></div></div>; })}<Button disabled={!orderedIds.length || reorderCategories.isPending || query.isLoading} onClick={() => reorderCategories.mutate({ categoryIds: orderedIds })} className="mt-2 w-full rounded-xl bg-cyan-300 text-slate-950 hover:bg-cyan-200"><Save className="mr-2 h-4 w-4" />{reorderCategories.isPending ? "Saving…" : "Save order"}</Button></CardContent></Card><Card className="premium-card"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><Plus className="h-4 w-4 text-cyan-300" />Create category</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={event => { event.preventDefault(); createCategory.mutate({ name, slug, description, icon: icon || undefined }); }}><div><label className="text-xs font-semibold text-slate-300">Name</label><Input value={name} onChange={event => setName(event.target.value)} className="mt-2 border-white/10 bg-white/5 text-white" placeholder="Product feedback" required minLength={2} /></div><div><label className="text-xs font-semibold text-slate-300">Slug</label><Input value={slug} onChange={event => setSlug(event.target.value)} className="mt-2 border-white/10 bg-white/5 text-white" placeholder="product-feedback" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></div><div><label className="text-xs font-semibold text-slate-300">Description</label><Textarea value={description} onChange={event => setDescription(event.target.value)} className="mt-2 min-h-24 border-white/10 bg-white/5 text-white" placeholder="A focused space for product ideas and feedback." required minLength={10} /></div><div><label className="text-xs font-semibold text-slate-300">Icon name <span className="font-normal text-slate-600">optional</span></label><Input value={icon} onChange={event => setIcon(event.target.value)} className="mt-2 border-white/10 bg-white/5 text-white" placeholder="sparkles" maxLength={40} /></div><Button disabled={createCategory.isPending} className="w-full rounded-xl bg-white text-slate-950 hover:bg-cyan-100">{createCategory.isPending ? "Creating…" : "Create category"}</Button></form></CardContent></Card></div></div></CommunityLayout>;
}
