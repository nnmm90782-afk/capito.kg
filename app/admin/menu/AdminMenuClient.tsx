"use client";

import { useState, useRef, useTransition } from "react";
import {
  Plus, Trash2, Eye, EyeOff, Edit3, Save, X, Upload,
  ImageOff, Star, StarOff, ChevronDown, Search,
} from "lucide-react";
import {
  createProduct, updateProduct, deleteProduct,
  toggleProductVisibility, toggleProductFeatured,
} from "@/app/admin/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category { slug: string; name: string }
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  badge: string;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  category_slug: string;
  category_name: string;
}

interface Props { products: Product[]; categories: Category[] }

const BADGES = ["", "Новинка", "Хит", "Скидка", "Лимит"];
const ACCENT = "#f5a623";

// ─── Image uploader ───────────────────────────────────────────────────────────

function ImageInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden"
      style={{
        borderColor: drag ? ACCENT : "var(--border-gold)",
        background: "var(--bg-base)",
        height: 140,
      }}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault(); setDrag(false);
        const f = e.dataTransfer.files[0]; if (f) handleFile(f);
      }}
    >
      {value ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button" onClick={() => ref.current?.click()}
              className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-black"
            >Заменить</button>
            <button
              type="button" onClick={() => onChange("")}
              className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white"
            >Удалить</button>
          </div>
        </>
      ) : (
        <button
          type="button" onClick={() => ref.current?.click()}
          className="w-full h-full flex flex-col items-center justify-center gap-2"
          style={{ color: "var(--text-faint)" }}
        >
          <Upload size={20} style={{ color: ACCENT }} />
          <span className="text-xs font-medium">Загрузить фото</span>
          <span className="text-[11px]">или перетащите</span>
        </button>
      )}
      <input
        ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}

// ─── Product form modal ───────────────────────────────────────────────────────

function ProductModal({
  mode,
  initial,
  categories,
  onClose,
}: {
  mode: "create" | "edit";
  initial?: Partial<Product>;
  categories: Category[];
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [badge, setBadge] = useState(initial?.badge ?? "");
  const [categorySlug, setCategorySlug] = useState(initial?.category_slug ?? categories[0]?.slug ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [pending, startTransition] = useTransition();

  const handleSubmit = () => {
    const fd = new FormData();
    if (mode === "edit" && initial?.id) fd.set("id", initial.id);
    fd.set("name", name);
    fd.set("description", description);
    fd.set("price", price);
    fd.set("badge", badge);
    fd.set("categorySlug", categorySlug);
    fd.set("imageUrl", imageUrl);

    startTransition(async () => {
      if (mode === "create") await createProduct(fd);
      else await updateProduct(fd);
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border p-6"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)", boxShadow: "var(--shadow-glow)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
            {mode === "create" ? "Новый товар" : "Редактировать товар"}
          </h3>
          <button
            type="button" onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--bg-base)", color: "var(--text-faint)" }}
          ><X size={15} /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left */}
          <div className="flex flex-col gap-4">
            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Категория</label>
              <div className="relative">
                <select
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm appearance-none outline-none pr-8"
                  style={{ background: "var(--bg-base)", borderColor: "var(--border-gold)", color: "var(--text-primary)" }}
                >
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
              </div>
            </div>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Название <span style={{ color: ACCENT }}>*</span>
              </label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Капучино"
                className="px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ background: "var(--bg-base)", borderColor: "var(--border-gold)", color: "var(--text-primary)" }}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Описание</label>
              <textarea
                rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание товара..."
                className="px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                style={{ background: "var(--bg-base)", borderColor: "var(--border-gold)", color: "var(--text-primary)" }}
              />
            </div>

            {/* Price + Badge */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  Цена (сом) <span style={{ color: ACCENT }}>*</span>
                </label>
                <input
                  type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)}
                  placeholder="220"
                  className="px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ background: "var(--bg-base)", borderColor: "var(--border-gold)", color: "var(--text-primary)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Бейдж</label>
                <div className="relative">
                  <select
                    value={badge} onChange={(e) => setBadge(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm appearance-none outline-none pr-8"
                    style={{ background: "var(--bg-base)", borderColor: "var(--border-gold)", color: "var(--text-primary)" }}
                  >
                    {BADGES.map((b) => <option key={b} value={b}>{b || "— нет —"}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Right: image */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Фото товара</label>
              <ImageInput value={imageUrl} onChange={setImageUrl} />
            </div>

            {/* Mini preview */}
            <div
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: "var(--border-subtle)", background: "var(--bg-base)" }}
            >
              <div className="h-28 flex items-center justify-center relative" style={{ background: "var(--drink-img-bg)" }}>
                {imageUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  : <ImageOff size={28} style={{ color: "rgba(245,166,35,0.25)" }} />
                }
                {badge && (
                  <div
                    className="absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }}
                  >{badge}</div>
                )}
              </div>
              <div className="p-3">
                <div className="font-bold text-sm" style={{ color: name ? "var(--text-primary)" : "var(--text-faint)" }}>
                  {name || "Название товара"}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-black" style={{ color: ACCENT }}>
                    {price ? `${price} сом` : "— сом"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button" onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border-gold)" }}
          >Отмена</button>
          <button
            type="button" onClick={handleSubmit} disabled={!name || !price || pending}
            className="flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold disabled:opacity-50 transition-all hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }}
          >
            <Save size={14} />
            {pending ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export default function AdminMenuClient({ products: initial, categories }: Props) {
  const [products, setProducts] = useState(initial);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [, startTransition] = useTransition();

  const openCreate = () => { setEditingProduct(undefined); setModalMode("create"); };
  const openEdit = (p: Product) => { setEditingProduct(p); setModalMode("edit"); };
  const closeModal = () => { setModalMode(null); setEditingProduct(undefined); };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || p.category_slug === filterCat;
    return matchSearch && matchCat;
  });

  const handleToggleVisibility = (p: Product) => {
    const fd = new FormData();
    fd.set("id", p.id);
    startTransition(async () => {
      await toggleProductVisibility(fd);
      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
    });
  };

  const handleToggleFeatured = (p: Product) => {
    const fd = new FormData();
    fd.set("id", p.id);
    startTransition(async () => {
      await toggleProductFeatured(fd);
      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, is_featured: !x.is_featured } : x));
    });
  };

  const handleDelete = (p: Product) => {
    if (!confirm(`Удалить «${p.name}»?`)) return;
    const fd = new FormData();
    fd.set("id", p.id);
    startTransition(async () => {
      await deleteProduct(fd);
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    });
  };

  const activeCount = products.filter((p) => p.is_active).length;
  const hiddenCount = products.filter((p) => !p.is_active).length;
  const featuredCount = products.filter((p) => p.is_featured).length;

  return (
    <div className="p-8 space-y-6" style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>Меню</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>
            Управление товарами — изменения сразу отображаются на сайте
          </p>
        </div>
        <button
          type="button" onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }}
        >
          <Plus size={16} />
          Добавить товар
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Всего товаров", value: products.length, color: "#f5a623" },
          { label: "На сайте", value: activeCount, color: "#4ade80" },
          { label: "Скрыто", value: hiddenCount, color: "#9ca3af" },
          { label: "Рекомендуемых", value: featuredCount, color: "#a78bfa" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border p-4"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
          >
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
          <input
            type="text" placeholder="Поиск товара..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)", color: "var(--text-primary)" }}
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterCat("all")}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={filterCat === "all"
              ? { background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }
              : { background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
          >Все</button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setFilterCat(c.slug)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={filterCat === c.slug
                ? { background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }
                : { background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
            >{c.name}</button>
          ))}
        </div>
      </div>

      {/* Products grid */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl border p-12 text-center"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)", color: "var(--text-faint)" }}
        >
          {search ? `Ничего не найдено по «${search}»` : "Товаров нет. Добавьте первый!"}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border overflow-hidden flex flex-col transition-all"
              style={{
                background: "var(--bg-card)",
                borderColor: p.is_active ? "var(--border-gold)" : "var(--border-subtle)",
                opacity: p.is_active ? 1 : 0.6,
                boxShadow: "var(--shadow-card)",
              }}
            >
              {/* Image */}
              <div
                className="h-36 flex items-center justify-center relative"
                style={{ background: "var(--drink-img-bg)" }}
              >
                {p.image_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  : <ImageOff size={32} style={{ color: "rgba(245,166,35,0.2)" }} />
                }
                {p.badge && (
                  <div
                    className="absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }}
                  >{p.badge}</div>
                )}
                {!p.is_active && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
                    <span className="text-xs font-bold text-white bg-black/60 px-3 py-1 rounded-full">Скрыт</span>
                  </div>
                )}
                {p.is_featured && (
                  <div
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(167,139,250,0.9)" }}
                  >
                    <Star size={12} fill="#fff" color="#fff" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 flex-1 flex flex-col gap-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                    {p.category_name}
                  </span>
                </div>
                <div className="font-bold text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
                  {p.name}
                </div>
                {p.description && (
                  <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: "var(--text-faint)" }}>
                    {p.description}
                  </p>
                )}
                <div className="font-black text-base mt-auto pt-1" style={{ color: ACCENT }}>
                  {p.price.toLocaleString("ru-RU")} сом
                </div>
              </div>

              {/* Actions */}
              <div
                className="flex items-center gap-1 px-3 py-2.5 border-t"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                {/* Edit */}
                <button
                  type="button" onClick={() => openEdit(p)}
                  title="Редактировать"
                  className="flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-[#f5a62318]"
                  style={{ color: "#f5a623" }}
                >
                  <Edit3 size={13} />
                </button>

                {/* Visibility */}
                <button
                  type="button" onClick={() => handleToggleVisibility(p)}
                  title={p.is_active ? "Скрыть" : "Показать"}
                  className="flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    color: p.is_active ? "#4ade80" : "#9ca3af",
                    background: p.is_active ? "#4ade8012" : undefined,
                  }}
                >
                  {p.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>

                {/* Featured */}
                <button
                  type="button" onClick={() => handleToggleFeatured(p)}
                  title={p.is_featured ? "Убрать рекомендацию" : "Рекомендовать"}
                  className="flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs transition-all"
                  style={{ color: p.is_featured ? "#a78bfa" : "var(--text-faint)" }}
                >
                  {p.is_featured ? <Star size={13} fill="#a78bfa" /> : <StarOff size={13} />}
                </button>

                {/* Delete */}
                <button
                  type="button" onClick={() => handleDelete(p)}
                  title="Удалить"
                  className="flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs transition-all hover:bg-red-500/10"
                  style={{ color: "#f87171" }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalMode && (
        <ProductModal
          mode={modalMode}
          initial={editingProduct}
          categories={categories}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
