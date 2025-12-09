import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getBanners, setBanners, getProfessors, setProfessors, getTags, setTags, getTestimonials, setTestimonials, getFAQs, setFAQs, getUsers } from '@/lib/localStorage';
import { Banner, Professor, Tag, Testimonial, FAQ, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Banners Page
export function AdminBanners() {
  const [items, setItems] = useState<Banner[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Banner | null>(null);
  const [form, setForm] = useState({ title: '', subtitle: '', image: '', ctaText: '', ctaLink: '' });
  const { toast } = useToast();
  useEffect(() => { setItems(getBanners()); }, []);
  const save = () => {
    const item: Banner = { id: selected?.id || Math.random().toString(36).substr(2,9), ...form };
    const updated = selected ? items.map(i => i.id === item.id ? item : i) : [...items, item];
    setBanners(updated); setItems(updated); setOpen(false); setSelected(null);
    setForm({ title: '', subtitle: '', image: '', ctaText: '', ctaLink: '' }); toast({ title: 'Salvo!' });
  };
  const del = (id: string) => { const updated = items.filter(i => i.id !== id); setBanners(updated); setItems(updated); };
  return (
    <AdminLayout>
      <div className="flex justify-between mb-6"><h1 className="text-2xl font-bold">Banners</h1>
        <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="gradient-bg text-primary-foreground"><Plus className="w-4 h-4 mr-2"/>Novo</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>{selected?'Editar':'Novo'} Banner</DialogTitle></DialogHeader>
            <div className="space-y-3"><Input placeholder="Título" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><Input placeholder="Subtítulo" value={form.subtitle} onChange={e=>setForm({...form,subtitle:e.target.value})}/><Input placeholder="URL Imagem" value={form.image} onChange={e=>setForm({...form,image:e.target.value})}/><Input placeholder="Texto CTA" value={form.ctaText} onChange={e=>setForm({...form,ctaText:e.target.value})}/><Input placeholder="Link CTA" value={form.ctaLink} onChange={e=>setForm({...form,ctaLink:e.target.value})}/><Button onClick={save} className="w-full gradient-bg text-primary-foreground">Salvar</Button></div>
          </DialogContent></Dialog></div>
      <div className="grid gap-4">{items.map(i=><div key={i.id} className="bg-card p-4 rounded-xl border flex gap-4"><img src={i.image} className="w-24 h-16 object-cover rounded"/><div className="flex-1"><h3 className="font-bold">{i.title}</h3><p className="text-sm text-muted-foreground">{i.subtitle}</p></div><Button variant="outline" size="icon" onClick={()=>{setSelected(i);setForm(i);setOpen(true)}}><Pencil className="w-4 h-4"/></Button><Button variant="destructive" size="icon" onClick={()=>del(i.id)}><Trash2 className="w-4 h-4"/></Button></div>)}</div>
    </AdminLayout>
  );
}

// Professors Page
export function AdminProfessores() {
  const [items, setItems] = useState<Professor[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Professor | null>(null);
  const [form, setForm] = useState({ name: '', specialty: '', image: '', bio: '' });
  const { toast } = useToast();
  useEffect(() => { setItems(getProfessors()); }, []);
  const save = () => {
    const item: Professor = { id: selected?.id || Math.random().toString(36).substr(2,9), ...form };
    const updated = selected ? items.map(i => i.id === item.id ? item : i) : [...items, item];
    setProfessors(updated); setItems(updated); setOpen(false); setSelected(null);
    setForm({ name: '', specialty: '', image: '', bio: '' }); toast({ title: 'Salvo!' });
  };
  const del = (id: string) => { const updated = items.filter(i => i.id !== id); setProfessors(updated); setItems(updated); };
  return (
    <AdminLayout>
      <div className="flex justify-between mb-6"><h1 className="text-2xl font-bold">Professores</h1>
        <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="gradient-bg text-primary-foreground"><Plus className="w-4 h-4 mr-2"/>Novo</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>{selected?'Editar':'Novo'} Professor</DialogTitle></DialogHeader>
            <div className="space-y-3"><Input placeholder="Nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><Input placeholder="Especialidade" value={form.specialty} onChange={e=>setForm({...form,specialty:e.target.value})}/><Input placeholder="URL Foto" value={form.image} onChange={e=>setForm({...form,image:e.target.value})}/><Textarea placeholder="Bio" value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})}/><Button onClick={save} className="w-full gradient-bg text-primary-foreground">Salvar</Button></div>
          </DialogContent></Dialog></div>
      <div className="grid gap-4">{items.map(i=><div key={i.id} className="bg-card p-4 rounded-xl border flex gap-4"><img src={i.image} className="w-16 h-16 object-cover rounded-full"/><div className="flex-1"><h3 className="font-bold">{i.name}</h3><p className="text-sm text-muted-foreground">{i.specialty}</p></div><Button variant="outline" size="icon" onClick={()=>{setSelected(i);setForm(i);setOpen(true)}}><Pencil className="w-4 h-4"/></Button><Button variant="destructive" size="icon" onClick={()=>del(i.id)}><Trash2 className="w-4 h-4"/></Button></div>)}</div>
    </AdminLayout>
  );
}

// Tags Page
export function AdminTags() {
  const [items, setItems] = useState<Tag[]>([]);
  const [form, setForm] = useState({ name: '', color: '#3B82F6' });
  useEffect(() => { setItems(getTags()); }, []);
  const add = () => { const item: Tag = { id: Math.random().toString(36).substr(2,9), ...form }; const updated = [...items, item]; setTags(updated); setItems(updated); setForm({ name: '', color: '#3B82F6' }); };
  const del = (id: string) => { const updated = items.filter(i => i.id !== id); setTags(updated); setItems(updated); };
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Tags</h1>
      <div className="flex gap-2 mb-6"><Input placeholder="Nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><Input type="color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})} className="w-16"/><Button onClick={add} className="gradient-bg text-primary-foreground"><Plus className="w-4 h-4"/></Button></div>
      <div className="flex flex-wrap gap-2">{items.map(i=><div key={i.id} className="flex items-center gap-2 px-4 py-2 rounded-full" style={{background:`${i.color}20`,color:i.color,border:`2px solid ${i.color}40`}}><span>{i.name}</span><button onClick={()=>del(i.id)} className="hover:opacity-70"><Trash2 className="w-4 h-4"/></button></div>)}</div>
    </AdminLayout>
  );
}

// Testimonials Page
export function AdminDepoimentos() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Testimonial | null>(null);
  const [form, setForm] = useState({ name: '', course: '', text: '', rating: '5', avatar: '' });
  useEffect(() => { setItems(getTestimonials()); }, []);
  const save = () => {
    const item: Testimonial = { id: selected?.id || Math.random().toString(36).substr(2,9), ...form, rating: Number(form.rating) };
    const updated = selected ? items.map(i => i.id === item.id ? item : i) : [...items, item];
    setTestimonials(updated); setItems(updated); setOpen(false); setSelected(null);
    setForm({ name: '', course: '', text: '', rating: '5', avatar: '' });
  };
  const del = (id: string) => { const updated = items.filter(i => i.id !== id); setTestimonials(updated); setItems(updated); };
  return (
    <AdminLayout>
      <div className="flex justify-between mb-6"><h1 className="text-2xl font-bold">Depoimentos</h1>
        <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="gradient-bg text-primary-foreground"><Plus className="w-4 h-4 mr-2"/>Novo</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>{selected?'Editar':'Novo'} Depoimento</DialogTitle></DialogHeader>
            <div className="space-y-3"><Input placeholder="Nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><Input placeholder="Curso" value={form.course} onChange={e=>setForm({...form,course:e.target.value})}/><Textarea placeholder="Texto" value={form.text} onChange={e=>setForm({...form,text:e.target.value})}/><Input placeholder="Nota (1-5)" type="number" value={form.rating} onChange={e=>setForm({...form,rating:e.target.value})}/><Input placeholder="URL Avatar" value={form.avatar} onChange={e=>setForm({...form,avatar:e.target.value})}/><Button onClick={save} className="w-full gradient-bg text-primary-foreground">Salvar</Button></div>
          </DialogContent></Dialog></div>
      <div className="grid gap-4">{items.map(i=><div key={i.id} className="bg-card p-4 rounded-xl border flex gap-4"><img src={i.avatar} className="w-12 h-12 object-cover rounded-full"/><div className="flex-1"><h3 className="font-bold">{i.name}</h3><p className="text-sm text-muted-foreground line-clamp-1">{i.text}</p></div><Button variant="outline" size="icon" onClick={()=>{setSelected(i);setForm({...i,rating:String(i.rating)});setOpen(true)}}><Pencil className="w-4 h-4"/></Button><Button variant="destructive" size="icon" onClick={()=>del(i.id)}><Trash2 className="w-4 h-4"/></Button></div>)}</div>
    </AdminLayout>
  );
}

// FAQ Page
export function AdminFAQ() {
  const [items, setItems] = useState<FAQ[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<FAQ | null>(null);
  const [form, setForm] = useState({ question: '', answer: '' });
  useEffect(() => { setItems(getFAQs()); }, []);
  const save = () => {
    const item: FAQ = { id: selected?.id || Math.random().toString(36).substr(2,9), ...form };
    const updated = selected ? items.map(i => i.id === item.id ? item : i) : [...items, item];
    setFAQs(updated); setItems(updated); setOpen(false); setSelected(null); setForm({ question: '', answer: '' });
  };
  const del = (id: string) => { const updated = items.filter(i => i.id !== id); setFAQs(updated); setItems(updated); };
  return (
    <AdminLayout>
      <div className="flex justify-between mb-6"><h1 className="text-2xl font-bold">FAQ</h1>
        <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="gradient-bg text-primary-foreground"><Plus className="w-4 h-4 mr-2"/>Nova</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>{selected?'Editar':'Nova'} Pergunta</DialogTitle></DialogHeader>
            <div className="space-y-3"><Input placeholder="Pergunta" value={form.question} onChange={e=>setForm({...form,question:e.target.value})}/><Textarea placeholder="Resposta" value={form.answer} onChange={e=>setForm({...form,answer:e.target.value})}/><Button onClick={save} className="w-full gradient-bg text-primary-foreground">Salvar</Button></div>
          </DialogContent></Dialog></div>
      <div className="grid gap-4">{items.map(i=><div key={i.id} className="bg-card p-4 rounded-xl border"><h3 className="font-bold">{i.question}</h3><p className="text-sm text-muted-foreground mt-1 line-clamp-2">{i.answer}</p><div className="flex gap-2 mt-3"><Button variant="outline" size="sm" onClick={()=>{setSelected(i);setForm(i);setOpen(true)}}><Pencil className="w-4 h-4 mr-1"/>Editar</Button><Button variant="destructive" size="sm" onClick={()=>del(i.id)}><Trash2 className="w-4 h-4 mr-1"/>Excluir</Button></div></div>)}</div>
    </AdminLayout>
  );
}

// Alunos Page
export function AdminAlunos() {
  const [users, setUsersState] = useState<User[]>([]);
  useEffect(() => { setUsersState(getUsers().filter(u => u.email !== 'admin@admin.com')); }, []);
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Alunos</h1>
      <div className="grid gap-4">{users.map(u=><div key={u.id} className="bg-card p-4 rounded-xl border flex gap-4"><div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-bold">{u.name.charAt(0)}</div><div className="flex-1"><h3 className="font-bold">{u.name}</h3><p className="text-sm text-muted-foreground">{u.email}</p></div><span className="text-sm text-muted-foreground">{u.purchasedCourses.length} cursos</span></div>)}</div>
    </AdminLayout>
  );
}
