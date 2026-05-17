"use client";
import { useState } from "react";

interface Props {
  placeholder: string;
  submitLabel: string;
}

export default function NewsletterForm({ placeholder, submitLabel }: Props) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // TODO: POST /api/newsletter
    setDone(true);
  };

  if (done) {
    return (
      <p className="text-[13px] text-white/70 tracking-[0.06em]">
        ✓ Спасибо! Вы подписаны на рассылку.
      </p>
    );
  }

  return (
    <form
      className="flex max-w-[400px] mx-auto border-b border-white/40"
      onSubmit={handleSubmit}
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none outline-none text-white text-[13px] py-3 placeholder:text-white/45"
      />
      <button
        type="submit"
        className="text-[11px] tracking-[0.2em] uppercase text-white pl-5 py-3 hover:opacity-70 transition-opacity whitespace-nowrap"
      >
        {submitLabel} →
      </button>
    </form>
  );
}
