"use client";

export default function AdminChart({
  data,
}: {
  data: { date: string; users: number; students: number; payments: number }[];
}) {
  const w = 800;
  const h = 240;
  const pad = 24;

  const maxUsers = Math.max(...data.map((d) => d.users), 1);
  const step = (w - pad * 2) / (data.length - 1);

  const points = data.map((d, i) => [
    pad + i * step,
    h - pad - (d.users / maxUsers) * (h - pad * 2),
  ]);

  let path = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i][0]},${points[i][1]}`;
  }

  const area = `${path} L ${points[points.length - 1][0]},${h - pad} L ${points[0][0]},${h - pad} Z`;

  const toFa = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        <defs>
          <linearGradient id="adminFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d94f63" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#d94f63" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#adminFill)" />
        <path d={path} fill="none" stroke="#d94f63" strokeWidth="2.5" strokeLinecap="round" />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3} fill="#fff" stroke="#d94f63" strokeWidth="2" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between px-2 text-[10px] font-bold text-[var(--c-ink-soft)]">
        {data.filter((_, i) => i % 5 === 0).map((d) => (
          <span key={d.date}>{toFa(d.date.slice(5))}</span>
        ))}
      </div>
    </div>
  );
}