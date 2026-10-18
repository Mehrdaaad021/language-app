"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, ShieldAlert, QrCode, KeyRound, X } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  getTwoFactorStatus,
  startTwoFactorSetup,
  confirmTwoFactorSetup,
  cancelTwoFactorSetup,
  disableTwoFactor,
} from "@/lib/server/two-factor-actions";

type Mode = "idle" | "setup" | "confirm" | "disable";

export default function TwoFactorSettings() {
  const t = useTranslations("Settings");
  const toast = useToast();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getTwoFactorStatus()
      .then((r) => setEnabled(r.enabled))
      .catch(() => setEnabled(false));
  }, []);

  if (enabled === null) {
    return (
      <Card>
        <div className="h-32 animate-pulse rounded-2xl bg-white/25" />
      </Card>
    );
  }

  const startSetup = async () => {
    setLoading(true);
    try {
      const res = await startTwoFactorSetup();
      setQr(res.qrDataUrl);
      setSecret(res.secret);
      setCode("");
      setError(null);
      setMode("setup");
    } catch {
      toast(t("error"));
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError("invalidCode");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await confirmTwoFactorSetup(code);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEnabled(true);
    setMode("idle");
    setQr(null);
    setSecret(null);
    toast(t("twoFactorEnabled"));
  };

  const cancelSetup = async () => {
    await cancelTwoFactorSetup();
    setMode("idle");
    setQr(null);
    setSecret(null);
    setCode("");
    setError(null);
  };

  const startDisable = () => {
    setPassword("");
    setError(null);
    setMode("disable");
  };

  const confirmDisable = async () => {
    setLoading(true);
    setError(null);
    const res = await disableTwoFactor(password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEnabled(false);
    setMode("idle");
    setPassword("");
    toast(t("twoFactorDisabled"));
  };

  return (
    <>
      <Card>
        <div className="flex items-start gap-4">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              enabled
                ? "bg-[rgba(122,178,146,0.20)] text-[#2F6B4F]"
                : "bg-white/30 text-[var(--color-ink-soft)]"
            }`}
          >
            {enabled ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-extrabold">{t("twoFactor")}</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                  enabled
                    ? "bg-[rgba(122,178,146,0.20)] text-[#2F6B4F]"
                    : "bg-white/30 text-[var(--color-ink-soft)]"
                }`}
              >
                {enabled ? t("on") : t("off")}
              </span>
            </div>
            <p className="mt-1 text-xs leading-6 text-[var(--color-ink-soft)]">{t("twoFactorDesc")}</p>
            <div className="mt-4">
              {enabled ? (
                <Button variant="glass" icon={<ShieldAlert size={15} />} onClick={startDisable}>
                  {t("disable2fa")}
                </Button>
              ) : (
                <Button icon={<QrCode size={15} />} onClick={startSetup}>
                  {loading ? t("loading") : t("enable2fa")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* مودال Setup: نمایش QR */}
      <Modal
        open={mode === "setup"}
        onClose={cancelSetup}
        title={t("setupTitle")}
      >
        <div className="flex flex-col items-center gap-4">
          <p className="text-center text-xs text-[var(--color-ink-soft)]">{t("setupStep1")}</p>
          {qr && (
            <img
              src={qr}
              alt="QR Code"
              className="h-64 w-64 rounded-2xl bg-white p-3 shadow-inner"
            />
          )}
          <p className="text-center text-xs font-bold text-[var(--color-ink-soft)]">{t("setupStep2")}</p>
          {secret && (
            <div className="flex w-full items-center gap-2 rounded-xl bg-white/30 px-4 py-3 font-mono text-xs">
              <KeyRound size={14} className="shrink-0" />
              <span className="flex-1 break-all">{secret}</span>
            </div>
          )}
          <Button
            icon={<QrCode size={15} />}
            onClick={() => setMode("confirm")}
            className="mt-2 w-full justify-center"
          >
            {t("next")}
          </Button>
          <Button variant="ghost" onClick={cancelSetup} className="w-full justify-center">
            {t("cancel")}
          </Button>
        </div>
      </Modal>

      {/* مودال Confirm: وارد کردن کد */}
      <Modal
        open={mode === "confirm"}
        onClose={() => setMode("setup")}
        title={t("confirmTitle")}
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-[var(--color-ink-soft)]">{t("confirmHint")}</p>
          <TextField
            label={t("enterCode")}
            type="text"
            inputMode="numeric"
            placeholder="••••••"
            value={code}
            error={error ? t(`errors.${error}`) : undefined}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setMode("setup")}>
              {t("back")}
            </Button>
            <Button onClick={confirm}>
              {loading ? t("loading") : t("verifyAndEnable")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* مودال Disable */}
      <Modal
        open={mode === "disable"}
        onClose={() => setMode("idle")}
        title={t("disableTitle")}
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-[var(--color-ink-soft)]">{t("disableHint")}</p>
          <TextField
            label={t("yourPassword")}
            type="password"
            placeholder="••••••••"
            value={password}
            error={error ? t(`errors.${error}`) : undefined}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setMode("idle")}>
              {t("cancel")}
            </Button>
            <Button onClick={confirmDisable}>
              {loading ? t("loading") : t("confirmDisable")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}