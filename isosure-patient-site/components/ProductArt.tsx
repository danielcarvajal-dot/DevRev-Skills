import type { Product } from "@/lib/types";

const palettes: Record<string, [string, string]> = {
  "Hormone Therapy": ["#1d3c32", "#b68b3d"],
  "Women's Health": ["#3d2a32", "#d9b7a3"],
  "Men's Health": ["#1b2d3a", "#8aa3b5"],
  Thyroid: ["#3a2d1b", "#d4a24c"],
  "Pain & Inflammation": ["#2c1d1d", "#c47b6a"],
  Dermatology: ["#24312c", "#9ec3b0"],
  Wellness: ["#243326", "#7ea36b"],
  Pediatric: ["#2d3142", "#9aa4d4"],
};

export function ProductArt({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const [from, to] = palettes[product.category] ?? ["#1d3c32", "#b68b3d"];
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}
    >
      <svg viewBox="0 0 200 140" className="h-full w-full opacity-90" aria-hidden>
        <ellipse cx="150" cy="20" rx="50" ry="28" fill="white" opacity="0.08" />
        <rect x="78" y="28" width="44" height="78" rx="14" fill="white" opacity="0.16" />
        <rect x="86" y="18" width="28" height="18" rx="5" fill="white" opacity="0.28" />
        <path d="M70 118h60" stroke="white" strokeOpacity="0.25" strokeWidth="4" />
        <text
          x="100"
          y="72"
          textAnchor="middle"
          fill="white"
          fontSize="11"
          fontFamily="Georgia, serif"
          opacity="0.9"
        >
          {product.form}
        </text>
      </svg>
      <span className="absolute left-3 top-3 rounded-full bg-white/15 px-2 py-0.5 text-[11px] uppercase tracking-[0.14em] text-white">
        {product.category}
      </span>
    </div>
  );
}
