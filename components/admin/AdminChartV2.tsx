"use client";

import { useMemo, useState } from "react";

type Point = { date: string; users: number; students: number; payments: number };

const W = 900;
const H = 320;
const PAD_L = 48;
const PAD_R = 16;
const PAD_T = 20;
const PAD_B = 40;

function smoothPath(pts: [number, number][]) {
  if (pts.length === 0) return "";
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    d += ` Q ${x0},${y0} ${mx},${my}`;
  }
  const [lx, ly] = pts[pts.length - 1];
  d += ` T ${lx},${ly}`;
  return d;
}

export default function AdminChartV2({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const { userPts, studentPts, revenuePts, maxCount } = useMemo(() => {
    const maxCount = Math.max(...data.map((d) => Math.max(d.users, d.students)), 1);
    const maxRev = Math.max(...data.map((d) => d.payments), 1);
    const innerW = W - PAD_L - PAD_R;
    const innerH = H - PAD_T - PAD_B;
    const step = data.length > 1 ? innerW / (data.length - 1) : 0;
    const x = (i: number) => PAD_L + i * step;
    const yCount = (v: number) => PAD_T + innerH - (v / maxCount) * innerH;
    const yRev = (v: number) => PAD_T + innerH - (v / maxRev) * innerH;
    return {
      userPts: data.map((d, i) => [x(i), yCount(d.users)] as [number, number]),
      studentPts: data.map((d, i) => [x(i), yCount(d.students)] as [number, number]),
      revenuePts: data.map((d, i) => [x(i), yRev(d.payments)] as [number, number]),
      maxCount,
    };
  }, [data]);

  const toFa = (s: string | number) => String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
  const fmtToman = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const innerW = W - PAD_L - PAD_R;
    const step = data.length > 1 ? innerW / (data.length - 1) : 1;
    const idx = Math.round((relX - PAD_L) / step);
    setHover(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const usersArea = userPts.length
    ? `${smoothPath(userPts)} L ${userPts[userPts.length - 1][0]},${H - PAD_B} L ${userPts[0][0]},${H - PAD_B} Z`
    : "";

  return (
    <div className="relative">
      {/* راهنما */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-[11px] font-bold text-[var(--c-ink-soft)]">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#d94f63]" /> کاربران جدید
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2f9e6e]" /> شاگردهای جدید
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e9a23b]" /> درآمد (تومان)
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d94f63" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#d94f63" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* خطوط راهنما + برچسب محور Y */}
        {[0, 0.25, 0.5, 0.75, 1].map((r) => {
          const y = PAD_T + (H - PAD_T - PAD_B) * r;
          const val = Math.round(maxCount * (1 - r));
          return (
            <g key={r}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.07" />
              <text x={PAD_L - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--c-ink-soft)">
                {toFa(val)}
              </text>
            </g>
          );
        })}

        {/* سطح درآمد (کمرنگ) + خط نقطه‌چین */}
        {revenuePts.length > 0 && (
          <path
            d={`${smoothPath(revenuePts)} L ${revenuePts[revenuePts.length - 1][0]},${H - PAD_B} L ${revenuePts[0][0]},${H - PAD_B} Z`}
            fill="#e9a23b"
            opacity="0.10"
          />
        )}
        <path d={smoothPath(revenuePts)} fill="none" stroke="#e9a23b" strokeWidth="2" strokeDasharray="5 4" opacity="0.8" />

        {/* کاربران: سطح گرادیانی + خط ضخیم */}
        <path d={usersArea} fill="url(#gUsers)" />
        <path d={smoothPath(userPts)} fill="none" stroke="#d94f63" strokeWidth="3" strokeLinecap="round" />

        {/* شاگردها: خط سبز */}
        <path d={smoothPath(studentPts)} fill="none" stroke="#2f9e6e" strokeWidth="2.5" strokeLinecap="round" />

        {/* راهنمای hover + نقطه‌ها */}
        {hover !== null && userPts[hover] && (
          <g>
            <line
              x1={userPts[hover][0]}
              x2={userPts[hover][0]}
              y1={PAD_T}
              y2={H - PAD_B}
              stroke="#4a2430"
              strokeOpacity="0.25"
              strokeDasharray="3 3"
            />
            <circle cx={userPts[hover][0]} cy={userPts[hover][1]} r="5" fill="#fff" stroke="#d94f63" strokeWidth="3" />
            <circle cx={studentPts[hover][0]} cy={studentPts[hover][1]} r="4" fill="#fff" stroke="#2f9e6e" strokeWidth="3" />
            <circle cx={revenuePts[hover][0]} cy={revenuePts[hover][1]} r="4" fill="#fff" stroke="#e9a23b" strokeWidth="3" />
          </g>
        )}

        {/* برچسب محور X */}
        {data.map((d, i) =>
          i % 5 === 0 && userPts[i] ? (
            <text key={d.date} x={userPts[i][0]} y={H - PAD_B + 18} textAnchor="middle" fontSize="10" fill="var(--c-ink-soft)">
              {toFa(d.date.slice(5))}
            </text>
          ) : null
        )}
      </svg>

      {/* تولتیپ شناور */}
      {hover !== null && data[hover] && userPts[hover] && (
        <div
          className="pointer-events-none absolute top-2 rounded-2xl bg-[var(--c-surface)]/95 px-4 py-3 text-xs shadow-xl backdrop-blur"
          style={{ left: `${(userPts[hover][0] / W) * 100}%`, transform: "translateX(-50%)" }}
        >
          <p className="mb-1 font-extrabold">{toFa(data[hover].date)}</p>
          <p className="text-[#d94f63]">کاربر: {toFa(data[hover].users)}</p>
          <p className="text-[#2f9e6e]">شاگرد: {toFa(data[hover].students)}</p>
          <p className="text-[#e9a23b]">درآمد: {fmtToman(data[hover].payments)}</p>
        </div>
      )}
    </div>
  );
}