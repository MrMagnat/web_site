"use client";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";

const HERO_KEYS  = ["hero_type", "hero_url"] as const;
const BANNER_KEYS = ["banner_image", "banner_tag", "banner_title_1", "banner_title_2", "banner_subtitle", "banner_cta"] as const;
const ALL_KEYS = [...HERO_KEYS, ...BANNER_KEYS];

type Settings = Record<string, string>;

export default function AdminLandingPage() {
  const { getAuthHeaders } = useAdminAuth();

  // Hero
  const [heroType, setHeroType] = useState<"video" | "image">("video");
  const [heroUrl, setHeroUrl]   = useState("");
  const [heroUploading, setHeroUploading] = useState(false);

  // Hero text
  const [heroTag,      setHeroTag]      = useState("");
  const [heroTitle,    setHeroTitle]    = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroCtaText,  setHeroCtaText]  = useState("");
  const [heroCtaLink,  setHeroCtaLink]  = useState("");

  // Banner
  const [bannerImage,    setBannerImage]    = useState("");
  const [bannerTag,      setBannerTag]      = useState("Весна · Лето 2026");
  const [bannerTitle1,   setBannerTitle1]   = useState("Новая коллекция");
  const [bannerTitle2,   setBannerTitle2]   = useState("уже в каталоге");
  const [bannerSubtitle, setBannerSubtitle] = useState("Скидки до 30% на выбранные позиции");
  const [bannerCta,      setBannerCta]      = useState("Смотреть каталог");
  const [bannerUploading, setBannerUploading] = useState(false);

  // Common
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    fetch("/api/admin/hero", { headers: getAuthHeaders() }).then(async (r) => {
      if (!r.ok) return;
      const d: Settings = await r.json();
      if (d.hero_type)       setHeroType(d.hero_type as "video" | "image");
      if (d.hero_url)        setHeroUrl(d.hero_url);
      if (d.hero_tag)        setHeroTag(d.hero_tag);
      if (d.hero_title)      setHeroTitle(d.hero_title);
      if (d.hero_subtitle)   setHeroSubtitle(d.hero_subtitle);
      if (d.hero_cta_text)   setHeroCtaText(d.hero_cta_text);
      if (d.hero_cta_link)   setHeroCtaLink(d.hero_cta_link);
      if (d.banner_image)    setBannerImage(d.banner_image);
      if (d.banner_tag)      setBannerTag(d.banner_tag);
      if (d.banner_title_1)  setBannerTitle1(d.banner_title_1);
      if (d.banner_title_2)  setBannerTitle2(d.banner_title_2);
      if (d.banner_subtitle) setBannerSubtitle(d.banner_subtitle);
      if (d.banner_cta)      setBannerCta(d.banner_cta);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function upload(file: File, type: "hero" | "banner"): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    // Do NOT include Content-Type — browser must set multipart/form-data with boundary automatically
    const allHeaders = getAuthHeaders() as Record<string, string>;
    const { "Content-Type": _ct, ...uploadHeaders } = allHeaders;
    const res = await fetch(`/api/admin/upload?type=${type}`, {
      method: "POST", headers: uploadHeaders, body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Upload error:", err);
      return null;
    }
    const data = await res.json();
    return data.url ?? null;
  }

  async function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    const url = await upload(file, "hero");
    setHeroUploading(false);
    if (url) {
      setHeroUrl(url);
      setHeroType(file.type.startsWith("video") ? "video" : "image");
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    const url = await upload(file, "banner");
    setBannerUploading(false);
    if (url) setBannerImage(url);
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/admin/hero", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        hero_type: heroType,
        hero_url:  heroUrl,
        hero_tag:       heroTag,
        hero_title:     heroTitle,
        hero_subtitle:  heroSubtitle,
        hero_cta_text:  heroCtaText,
        hero_cta_link:  heroCtaLink,
        banner_image:    bannerImage,
        banner_tag:      bannerTag,
        banner_title_1:  bannerTitle1,
        banner_title_2:  bannerTitle2,
        banner_subtitle: bannerSubtitle,
        banner_cta:      bannerCta,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const inputCls = "border rounded-lg px-3 py-2 text-sm outline-none w-full";
  const inputStyle = { borderColor: "#e8e0da", background: "#fff", color: "#191E1B" };
  const labelCls = "block text-xs font-medium mb-1.5";
  const labelStyle = { color: "#191E1B" };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/pages" className="p-1.5 rounded hover:bg-gray-100">
            <ArrowLeft size={18} style={{ color: "#9a9a9a" }} />
          </Link>
          <h1 className="text-xl font-semibold" style={{ color: "#191E1B" }}>
            Лендинг — Главная страница
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          style={{ background: "#3F1111", color: "#FAFAFA" }}
        >
          {saved ? <><Check size={14} /> Сохранено</> : saving ? "Сохранение..." : "Сохранить всё"}
        </button>
      </div>

      <div className="flex flex-col gap-6 max-w-2xl">

        {/* ── Приветственный экран ─────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm font-semibold mb-1" style={{ color: "#191E1B" }}>
            Приветственный экран
          </p>
          <p className="text-xs mb-5" style={{ color: "#9a9a9a" }}>
            Видео или фото на весь экран при входе на сайт
          </p>

          <div className="flex gap-3 mb-5">
            {(["video", "image"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setHeroType(t)}
                className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors"
                style={{
                  borderColor: heroType === t ? "#3F1111" : "#e8e0da",
                  background:  heroType === t ? "#3F1111" : "#fff",
                  color:       heroType === t ? "#FAFAFA" : "#9a9a9a",
                }}
              >
                {t === "video" ? "🎬 Видео" : "🖼 Фото"}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className={labelCls} style={labelStyle}>Загрузить файл</label>
            <input
              type="file"
              accept={heroType === "video" ? "video/*" : "image/*"}
              onChange={handleHeroUpload}
              className={`block ${inputCls}`}
              style={inputStyle}
            />
            {heroUploading && <p className="text-xs mt-1" style={{ color: "#9a9a9a" }}>Загрузка...</p>}
          </div>

          <div className="mb-4">
            <label className={labelCls} style={labelStyle}>Или вставьте URL</label>
            <input
              type="text"
              value={heroUrl}
              onChange={(e) => setHeroUrl(e.target.value)}
              placeholder="/uploads/hero/video.mp4"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {heroUrl && (
            <div className="rounded-lg overflow-hidden border" style={{ borderColor: "#e8e0da" }}>
              {heroType === "video"
                ? <video src={heroUrl} className="w-full h-36 object-cover" muted autoPlay loop playsInline />
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={heroUrl} alt="Hero" className="w-full h-36 object-cover" />
              }
            </div>
          )}

          {/* Текст приветственного экрана */}
          <div className="mt-6 pt-5 border-t" style={{ borderColor: "#F7F0EC" }}>
            <p className="text-sm font-semibold mb-4" style={{ color: "#191E1B" }}>
              Текст на приветственном экране
            </p>

            <div className="mb-4">
              <label className={labelCls} style={labelStyle}>Надпись над заголовком</label>
              <input type="text" value={heroTag} onChange={(e) => setHeroTag(e.target.value)}
                placeholder="Весна · Лето 2026" className={inputCls} style={inputStyle} />
            </div>

            <div className="mb-4">
              <label className={labelCls} style={labelStyle}>Заголовок (можно с переносом строки)</label>
              <textarea value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)}
                rows={2} placeholder="Дом, в котором&#10;уютно и красиво"
                className={`${inputCls} resize-y`} style={inputStyle} />
            </div>

            <div className="mb-4">
              <label className={labelCls} style={labelStyle}>Подзаголовок</label>
              <input type="text" value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="Текстиль для дома с бесплатной доставкой" className={inputCls} style={inputStyle} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={labelStyle}>Текст кнопки</label>
                <input type="text" value={heroCtaText} onChange={(e) => setHeroCtaText(e.target.value)}
                  placeholder="Смотреть коллекцию" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Ссылка кнопки</label>
                <input type="text" value={heroCtaLink} onChange={(e) => setHeroCtaLink(e.target.value)}
                  placeholder="/catalog" className={inputCls} style={inputStyle} />
              </div>
            </div>
            <p className="text-[11px] mt-2" style={{ color: "#9a9a9a" }}>
              Ссылка — путь внутри сайта, например <b>/catalog</b>, <b>/collections</b> или <b>/info/contacts</b>
            </p>
          </div>
        </div>

        {/* ── Баннер «Новая коллекция» ─────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm font-semibold mb-1" style={{ color: "#191E1B" }}>
            Баннер «Новая коллекция»
          </p>
          <p className="text-xs mb-5" style={{ color: "#9a9a9a" }}>
            Широкий блок с фоновым фото в середине страницы
          </p>

          {/* Image */}
          <div className="mb-4">
            <label className={labelCls} style={labelStyle}>Фоновое фото — загрузить</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              className={`block ${inputCls}`}
              style={inputStyle}
            />
            {bannerUploading && <p className="text-xs mt-1" style={{ color: "#9a9a9a" }}>Загрузка...</p>}
          </div>
          <div className="mb-5">
            <label className={labelCls} style={labelStyle}>Или вставьте URL фото</label>
            <input
              type="text"
              value={bannerImage}
              onChange={(e) => setBannerImage(e.target.value)}
              placeholder="/uploads/hero/banner.jpg"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {bannerImage && (
            <div className="rounded-lg overflow-hidden border mb-5" style={{ borderColor: "#e8e0da" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bannerImage} alt="Banner" className="w-full h-32 object-cover" />
            </div>
          )}

          {/* Texts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={labelStyle}>Подпись над заголовком</label>
              <input
                type="text"
                value={bannerTag}
                onChange={(e) => setBannerTag(e.target.value)}
                placeholder="Весна · Лето 2026"
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Подзаголовок</label>
              <input
                type="text"
                value={bannerSubtitle}
                onChange={(e) => setBannerSubtitle(e.target.value)}
                placeholder="Скидки до 30% на выбранные позиции"
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Заголовок — строка 1</label>
              <input
                type="text"
                value={bannerTitle1}
                onChange={(e) => setBannerTitle1(e.target.value)}
                placeholder="Новая коллекция"
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Заголовок — строка 2</label>
              <input
                type="text"
                value={bannerTitle2}
                onChange={(e) => setBannerTitle2(e.target.value)}
                placeholder="уже в каталоге"
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Текст кнопки</label>
              <input
                type="text"
                value={bannerCta}
                onChange={(e) => setBannerCta(e.target.value)}
                placeholder="Смотреть каталог"
                className={inputCls}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Live preview */}
          <div
            className="relative mt-5 h-36 rounded-lg overflow-hidden flex items-center justify-center text-center"
            style={{ background: bannerImage ? "transparent" : "#191E1B" }}
          >
            {bannerImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0" style={{ background: "rgba(25,30,27,0.45)" }} />
            <div className="relative z-10 px-4">
              <p className="text-[9px] tracking-[0.22em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                {bannerTag}
              </p>
              <p className="font-prata text-[18px] text-white leading-tight mb-1">
                {bannerTitle1}<br />{bannerTitle2}
              </p>
              <p className="text-[10px] mb-2" style={{ color: "rgba(255,255,255,0.65)" }}>
                {bannerSubtitle}
              </p>
              <span className="inline-block border text-[9px] tracking-widest uppercase px-4 py-1.5 text-white" style={{ borderColor: "rgba(255,255,255,0.5)" }}>
                {bannerCta}
              </span>
            </div>
          </div>
          <p className="text-[11px] mt-2" style={{ color: "#9a9a9a" }}>↑ Превью баннера</p>
        </div>

      </div>
    </div>
  );
}

// Suppress unused import warning
void ALL_KEYS;
