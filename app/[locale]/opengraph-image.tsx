import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "دستیار کلاس زبان";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const fa = locale === "fa";

  // تلاش برای بارگذاری فونت وزیرمتن از لوکال (TTF برای OG Image)
  let fonts: { name: string; data: ArrayBuffer; style: "normal"; weight: 400 }[] = [];
  try {
    // در Next 16، باید از globalThis.fetch استفاده کنیم تا TypeScript گیر نده
    const gFetch = globalThis.fetch;
    const response = await gFetch(
      "https://cdn.jsdelivr.net/npm/vazirmatn@33.0.3/fonts/ttf/Vazirmatn-Regular.ttf"
    );
    if (response.ok) {
      const ttf = await response.arrayBuffer();
      fonts = [{ name: "Vazirmatn", data: ttf, style: "normal", weight: 400 }];
    }
  } catch {
    // اگه فونت نرسید، با فونت پیش‌فرض satori رندر می‌شه
  }

  const fontFamily = fonts.length > 0 ? "Vazirmatn" : "sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          background: "linear-gradient(135deg, #f6eede 0%, #f8d8e0 100%)",
          fontFamily,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: 30,
              background: "linear-gradient(135deg, #E8697B, #D94F63)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 999, background: "#FFF7F0" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 54, fontWeight: 800, color: "#40222c" }}>
              {fa ? "دستیار کلاس زبان" : "Language Class Assistant"}
            </span>
            <span style={{ fontSize: 26, color: "#96707b" }}>
              {fa ? "مدیریت کلاس‌های خصوصی زبان" : "Manage your private language classes"}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {(fa ? ["شاگردها", "جلسات", "پرداخت‌ها", "دفترچه مشق"] : ["Students", "Sessions", "Payments", "Notebook"]).map(
            (chip) => (
              <span
                key={chip}
                style={{
                  background: "#f8d8e0",
                  color: "#4a2430",
                  fontSize: 20,
                  fontWeight: 700,
                  padding: "10px 22px",
                  borderRadius: 999,
                }}
              >
                {chip}
              </span>
            )
          )}
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}