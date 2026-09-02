"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqItem = { q: string; a: string };

export default function Faq({ faqs, layout }: { faqs: FaqItem[]; layout: "accordion" | "grid" }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (layout === "grid") {
    return (
      <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {faqs.map((f) => (
          <div key={f.q} className="bg-white shadow-[0px_0_25px_rgba(0,0,0,0.06)] p-6 border-l-4 border-green">
            <h3 className="font-bold text-dark mb-2">{f.q}</h3>
            <p className="text-sm text-dark/60 leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto divide-y divide-dark/10 bg-white shadow-[0px_0_25px_rgba(0,0,0,0.06)]">
      {faqs.map((f, i) => {
        const open = openIndex === i;
        return (
          <div key={f.q}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left cursor-pointer"
              aria-expanded={open}
            >
              <span className="font-semibold text-dark text-sm">{f.q}</span>
              <ChevronDown
                className={`w-4 h-4 text-green shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                strokeWidth={2}
              />
            </button>
            {open && <p className="px-6 pb-4 text-sm text-dark/60 leading-relaxed">{f.a}</p>}
          </div>
        );
      })}
    </div>
  );
}
