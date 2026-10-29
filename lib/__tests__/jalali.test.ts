import { describe, expect, it } from "vitest";
import { toJalali, jalaliToGregorian, jalaliMonthDays, toFa } from "@/lib/jalali";

describe("تبدیل میلادی → شمسی", () => {
  it("تاریخ امروز (۲۹ اکتبر ۲۰۲۶ = ۷ آبان ۱۴۰۵)", () => {
    expect(toJalali(2026, 10, 29)).toEqual([1405, 8, 7]);
  });

  it("نوروز ۱۴۰۵", () => {
    expect(toJalali(2026, 3, 21)).toEqual([1405, 1, 1]);
  });

  it("اول ژانویه‌ی ۲۰۲۶", () => {
    expect(toJalali(2026, 1, 1)).toEqual([1404, 10, 11]);
  });
});

describe("تبدیل شمسی → میلادی", () => {
  it("برگشت رفت‌وبرگشتی", () => {
    expect(jalaliToGregorian(1405, 8, 7)).toEqual([2026, 10, 29]);
  });

  it("نوروز", () => {
    expect(jalaliToGregorian(1405, 1, 1)).toEqual([2026, 3, 21]);
  });
});

describe("طول ماه‌های شمسی", () => {
  it("ماه‌های اول تا ششم ۳۱ روزه‌ان", () => {
    expect(jalaliMonthDays(1405, 1)).toBe(31);
    expect(jalaliMonthDays(1405, 6)).toBe(31);
  });

  it("ماه‌های هفتم تا یازدهم ۳۰ روزه‌ان", () => {
    expect(jalaliMonthDays(1405, 7)).toBe(30);
    expect(jalaliMonthDays(1405, 11)).toBe(30);
  });

  it("اسفند سال کبیسه ۳۰ روزه است (۱۴۰۳)", () => {
    expect(jalaliMonthDays(1403, 12)).toBe(30);
  });

  it("اسفند سال عادی ۲۹ روزه است (۱۴۰۴)", () => {
    expect(jalaliMonthDays(1404, 12)).toBe(29);
  });
});

describe("اعداد فارسی", () => {
  it("تبدیل ارقام", () => {
    expect(toFa(1234567890)).toBe("۱۲۳۴۵۶۷۸۹۰");
  });

  it("رشته‌ی مخلوط", () => {
    expect(toFa("سال 1405")).toBe("سال ۱۴۰۵");
  });
});