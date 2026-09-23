import { useState } from "react";
import { useWedding } from "@/hooks/useWedding";

type GiftItem = {
  bank?: string;
  bankName?: string;
  bank_name?: string;
  holder?: string;
  accountName?: string;
  account_name?: string;
  number?: string;
  accountNumber?: string;
  account_number?: string;
};

export default function Gift() {
  const { mergedData } = useWedding();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const gifts: GiftItem[] = Array.isArray(mergedData?.gifts)
    ? mergedData.gifts
    : [];

  const handleCopy = async (number: string, index: number) => {
    try {
      await navigator.clipboard.writeText(number);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1800);
    } catch {
      // Menyalin mungkin tidak tersedia di browser atau konteks non-HTTPS.
    }
  };

  return (
    <section id="gift" className="px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="mb-3 text-3xl font-semibold">Kirim Hadiah</h2>
        <p className="mb-8 text-gray-600">
          Doa dan kehadiran Anda merupakan hadiah terbaik bagi kami.
        </p>

        {gifts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {gifts.map((gift, index) => {
              const bank = gift.bank ?? gift.bankName ?? gift.bank_name ?? "";
              const holder =
                gift.holder ?? gift.accountName ?? gift.account_name ?? "";
              const number =
                gift.number ??
                gift.accountNumber ??
                gift.account_number ??
                "";

              // Jangan tampilkan kartu yang tidak memiliki informasi rekening.
              if (!bank && !holder && !number) return null;

              return (
                <article
                  key={`${bank}-${number}-${index}`}
                  className="rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm"
                >
                  {bank && (
                    <h3 className="mb-4 text-xl font-semibold">{bank}</h3>
                  )}

                  {holder && (
                    <p className="mb-2 text-sm text-gray-600">
                      Atas nama <span className="font-medium">{holder}</span>
                    </p>
                  )}

                  {number && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="break-all font-mono text-lg">{number}</p>
                      <button
                        type="button"
                        onClick={() => handleCopy(number, index)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        {copiedIndex === index ? "Tersalin" : "Salin"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="rounded-lg bg-gray-50 p-5 text-sm text-gray-600">
            Informasi rekening belum tersedia.
          </p>
        )}
      </div>
    </section>
  );
}
