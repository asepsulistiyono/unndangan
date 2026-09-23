import { useEffect, useRef, useState } from "react";
import { WEDDING } from "../../lib/wedding";
import { useWedding } from "../../hooks/useWedding";
import { useReveal } from "../../hooks/useReveal";
import { IconCheck, IconCopy, IconGift, IconPin } from "../Icons";
import { SectionHead } from "../Decor";

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

function CopyButton({ value, label = "Salin Nomor", copiedText = "Tersalin!" }: { value: string; label?: string; copiedText?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <button
      onClick={() => {
        copyText(value.replace(/\s/g, ""));
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), 2200);
      }}
      className={`inline-flex w-full items-center justify-center gap-2.5 border px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] transition-all duration-300 ${
        copied
          ? "border-gold-400 bg-gold-500/15 text-gold-200"
          : "border-gold-500/40 text-gold-300 hover:bg-gold-500 hover:text-pine-950"
      }`}
    >
      {copied ? <IconCheck className="size-4" /> : <IconCopy className="size-4" />}
      {copied ? copiedText : label}
    </button>
  );
}

export default function Gift() {
  const ref = useReveal();
  const { mergedData, t } = useWedding();

  return (
    <section id="kado" className="relative z-10 py-24 sm:py-32">
      <div ref={ref} className="mx-auto max-w-5xl px-5 sm:px-8">
        <SectionHead
          eyebrow={t.gift.tokenOfLove}
          title={
            <>
              {t.gift.mostBeautifulGift.split(" ")[0]} <em className="italic text-gold-300">{t.gift.mostBeautifulGift.split(" ").slice(1).join(" ")}</em>
            </>
          }
          sub={t.gift.subtitle}
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {mergedData.gifts.map((g, i) => (
            <div
              key={g.bank}
              className={`reveal ${i ? "from-right" : "from-left"} rd-1 group relative overflow-hidden border border-gold-500/20 bg-pine-800/70 p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-500/60 hover:shadow-[0_24px_60px_rgba(0,0,0,0.4)] sm:p-8`}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-5 -top-6 font-display text-[120px] italic leading-none text-gold-500/[0.06] transition-colors duration-500 group-hover:text-gold-500/[0.12]"
              >
                {g.bank[0]}
              </span>
              <div className="flex items-center gap-4">
                <span className="flex size-12 items-center justify-center rounded-full border border-gold-500/40 text-gold-400">
                  <IconGift className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold-300">
                    {g.bank}
                  </p>
                  <p className="mt-0.5 text-[13px] text-sage-300/80">a.n. {g.holder}</p>
                </div>
              </div>
              <p className="mt-7 font-display text-2xl tracking-[0.12em] text-ivory sm:text-[1.7rem]">
                {g.number}
              </p>
              <div className="mt-6">
                <CopyButton value={g.number} label={t.gift.copyNumber} copiedText={t.gift.copied} />
              </div>
            </div>
          ))}
        </div>

        {/* alamat hadiah fisik */}
        <div className="reveal rd-2 mt-6 flex flex-col items-center gap-5 border border-gold-500/20 bg-pine-800/50 p-7 text-center transition-colors duration-500 hover:border-gold-500/50 sm:flex-row sm:text-left">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-gold-500/40 text-gold-400">
            <IconPin className="size-5" />
          </span>
          <div className="flex-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold-300">
              {t.gift.sendGift}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-sage-300/90">
              {mergedData.giftAddress}
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <CopyButton value={mergedData.giftAddress} label={t.gift.copyAddress} copiedText={t.gift.copied} />
          </div>
        </div>
      </div>
    </section>
  );
}
