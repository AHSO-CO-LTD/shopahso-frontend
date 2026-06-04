"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ScanSearch, Search } from "lucide-react";
import { toast } from "sonner";

const QUICK_TERMS = ["PLC", "cảm biến áp suất", "contactor", "biến tần", "băng tải"];

export default function HeroSearchConsole() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [keyword, setKeyword] = useState("");

  function openCatalog(nextKeyword: string) {
    const normalizedKeyword = nextKeyword.trim();

    if (!normalizedKeyword) {
      toast.warning("Nhập SKU, Part Number hoặc từ khóa kỹ thuật trước khi tìm.");
      inputRef.current?.focus();
      return;
    }

    const params = new URLSearchParams();
    params.set("q", normalizedKeyword);
    toast.success("Đang mở catalog theo từ khóa của bạn.");
    router.push(`/san-pham?${params.toString()}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    openCatalog(keyword);
  }

  return (
    <div className="border border-border bg-background p-3 sm:p-4" data-hero-reveal>
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center border border-border bg-muted/40 text-primary">
            <ScanSearch className="size-4" />
          </span>
          <div>
            <p className="text-sm font-black">Bàn tìm mã kỹ thuật</p>
            <p className="text-xs text-muted-foreground">SKU, model, hãng, thông số</p>
          </div>
        </div>
        <span className="hidden font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary sm:inline">
          Live catalog
        </span>
      </div>

      <form className="grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="home-industrial-search">
          Tìm sản phẩm công nghiệp
        </label>
        <input
          ref={inputRef}
          id="home-industrial-search"
          className="h-12 border border-border bg-muted/20 px-3 font-mono text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-background"
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="VD: ATV320, E3Z, MCB 2P 20A..."
          type="search"
          value={keyword}
        />
        <button
          type="submit"
          className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-5 text-sm font-black text-primary-foreground transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Search className="size-4" />
          Tìm
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_TERMS.map((term) => (
          <button
            key={term}
            type="button"
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 border border-border px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:bg-muted hover:text-primary"
            onClick={() => {
              setKeyword(term);
              openCatalog(term);
            }}
          >
            {term}
            <ArrowRight className="size-3" />
          </button>
        ))}
      </div>
    </div>
  );
}
