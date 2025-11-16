"use client";

import React, { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function FloatingLangPicker() {
  const { t, lang, setLang } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (e.target && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const toggle = () => setOpen((s) => !s);

  const choose = (l: "th" | "en") => {
    setLang(l);
    setOpen(false);
  };

  return (
    <div ref={ref} className="fixed top-4 right-4 z-50">
      <div className="relative">
        <button
          onClick={toggle}
          aria-expanded={open}
          aria-label="Language"
          className="w-11 h-11 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
          title={lang === "th" ? t("language_th") : t("language_en")}
        >
          <Globe size={18} />
        </button>

        <div
          className={`origin-top-right absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-lg transform transition-all ${open ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}`}
          style={{ transformOrigin: "top right" }}
        >
          <div className="p-3">
            <div className="text-sm text-gray-300 mb-2">{t("language_th")}/{t("language_en")}</div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => choose("th")}
                className={`w-full text-left px-3 py-2 rounded ${lang === "th" ? "bg-gray-800 border border-green-400" : "hover:bg-gray-800"}`}
              >
                <span className="font-semibold">TH</span>
                <span className="ml-2 text-xs text-gray-400">{t("language_th")}</span>
              </button>

              <button
                onClick={() => choose("en")}
                className={`w-full text-left px-3 py-2 rounded ${lang === "en" ? "bg-gray-800 border border-green-400" : "hover:bg-gray-800"}`}
              >
                <span className="font-semibold">EN</span>
                <span className="ml-2 text-xs text-gray-400">{t("language_en")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
