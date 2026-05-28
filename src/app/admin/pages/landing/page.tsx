"use client";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";

export default function AdminLandingPage() {
  const { getAuthHeaders } = useAdminAuth();
  const [heroType, setHeroType] = useState<"video" | "image">("video");
  const [heroUrl, setHeroUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/hero", { headers: getAuthHeaders() }).then(async (r) => {
      if (r.ok) {
        const d = await r.json();
        if (d.hero_type) setHeroType(d.hero_type);
        if (d.hero_url) setHeroUrl(d.hero_url);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload?type=hero", {
      method: "POST",
      headers: getAuthHeaders(),
      body: fd,
    });
    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      setHeroUrl(data.url);
      setHeroType(file.type.startsWith("video") ? "video" : "image");
    }
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/admin/hero", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ hero_type: heroType, hero_url: heroUrl }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const inputStyle = { borderColor: "#e8e0da", background: "#fff", color: "#191E1B" };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/pages" className="p-1.5 rounded hover:bg-gray-100">
          <ArrowLeft size={18} style={{ color: "#9a9a9a" }} />
        </Link>
        <h1 className="text-xl font-semibold" style={{ color: "#191E1B" }}>
          Лендинг — Главная страница
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-xl">
        <p className="text-sm font-semibold mb-5" style={{ color: "#191E1B" }}>
          Медиа на приветственном экране
        </p>

        {/* Type selector */}
        <div className="flex gap-3 mb-5">
          {(["video", "image"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setHeroType(t)}
              className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors"
              style={{
                borderColor: heroType === t ? "#3F1111" : "#e8e0da",
                background: heroType === t ? "#3F1111" : "#fff",
                color: heroType === t ? "#FAFAFA" : "#9a9a9a",
              }}
            >
              {t === "video" ? "🎬 Видео" : "🖼 Фото"}
            </button>
          ))}
        </div>

        {/* Upload */}
        <div className="mb-4">
          <label className="block text-xs font-medium mb-2" style={{ color: "#191E1B" }}>
            Загрузить файл
          </label>
          <input
            type="file"
            accept={heroType === "video" ? "video/*" : "image/*"}
            onChange={handleUpload}
            className="block w-full text-sm border rounded-lg px-3 py-2"
            style={inputStyle}
          />
          {uploading && <p className="text-xs mt-1" style={{ color: "#9a9a9a" }}>Загрузка...</p>}
        </div>

        {/* URL input */}
        <div className="mb-5">
          <label className="block text-xs font-medium mb-2" style={{ color: "#191E1B" }}>
            Или введите URL файла вручную
          </label>
          <input
            type="text"
            value={heroUrl}
            onChange={(e) => setHeroUrl(e.target.value)}
            placeholder="/uploads/hero/video.mp4"
            className="border rounded-lg px-3 py-2 text-sm outline-none w-full"
            style={inputStyle}
          />
        </div>

        {/* Preview */}
        {heroUrl && (
          <div className="mb-5 rounded-lg overflow-hidden border" style={{ borderColor: "#e8e0da" }}>
            {heroType === "video" ? (
              <video src={heroUrl} className="w-full h-40 object-cover" muted autoPlay loop playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroUrl} alt="Hero preview" className="w-full h-40 object-cover" />
            )}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          style={{ background: "#3F1111", color: "#FAFAFA" }}
        >
          {saved ? <><Check size={14} /> Сохранено</> : saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
    </div>
  );
}
