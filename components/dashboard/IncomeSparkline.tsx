"use client";

/* نمودار خطی نرمِ درآمد ماهانه — سبک رفرنس (منحنی + سطح گرادیانی) */
export default function IncomeSparkline({
  points,
  labels,
}: {
  points: number[];
  labels: string[];
}) {
  const w = 560;
  const h = 170;
  const pad = 14;

  const max = Math.max(...points, 1);
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const coords: [number, number][] = points.map((p, i) => [
    pad + i * step,
    h - pad - (p / max) * (h - pad * 2.4),
  ]);

  /* منحنی نرم با نقاط میانی (quadratic smoothing) */
  let line = `M ${coords[0]?.[0] ?? pad},${coords[0]?.[1] ?? h - pad}`;
  for (let i = 1; i < coords.length; i++) {
    const [x0, y0] = coords[i - 1];
    const [x1, y1] = coords[i];
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    line += ` Q ${x0},${y0} ${mx},${my}`;
  }
  const last = coords[coords.length - 1] ?? [pad, h - pad];
  line += ` T ${last[0]},${last[1]}`;

  const area = `${line} L ${last[0]},${h - pad} L ${coords[0]?.[0] ?? pad},${h - pad} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="income chart">
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d94f63" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#d94f63" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* خطوط راهنمای افقی */}
        {[0.25, 0.5, 0.75].map((r) => (
          <line
            key={r}
            x1={pad}
            x2={w - pad}
            y1={pad + r * (h - pad * 2)}
            y2={pad + r * (h - pad * 2)}
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeDasharray="4 6"
          />
        ))}

        <path d={area} fill="url(#sparkFill)" />
        <path
          d={line}
          fill="none"
          stroke="#d94f63"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* نقطه‌های داده */}
        {coords.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i === coords.length - 1 ? 5 : 3.5}
            fill="#fff"
            stroke="#d94f63"
            strokeWidth="2.5"
          />
        ))}
      </svg>

      <div className="mt-1 flex justify-between px-2 text-[10px] font-bold text-[var(--c-ink-soft)]">
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </div>
  );
}