"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, ShieldAlert, QrCode, KeyRound, Copy, RefreshCw, Check } from "lucide-react";
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
  regenerateBackupCodes,
} from "@/lib/server/two-factor-actions";

type Mode = "idle" | "setup" | "backupCodes" | "confirm" | "disable" | "regenerate";

export default function TwoFactorSettings() {
  const t = useTranslations("Settings");
  const toast = useToast();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [mode, setMode] = useState<Mode>("idle");
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getTwoFactorStatus()
      .then((r) => {
        setEnabled(r.enabled);
        setRemaining(r.backupCodesRemaining);
      })
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
      setBackupCodes(res.backupCodes);
      setCode("");
      setError(null);
      setMode("setup");
    } catch {
      toast(t("error"));
    } finally {
      setLoading(false);
    }
  };

  const goToBackupCodes = () => {
    setMode("backupCodes");
  };

  const goToConfirm = () => {
    setCode("");
    setError(null);
    setMode("confirm");
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
    setRemaining(backupCodes.length);
    setMode("idle");
    setQr(null);
    setSecret(null);
    setBackupCodes([]);
    toast(t("twoFactorEnabled"));
  };

  const cancelSetup = async () => {
    await cancelTwoFactorSetup();
    setMode("idle");
    setQr(null);
    setSecret(null);
    setBackupCodes([]);
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
    setRemaining(0);
    setMode("idle");
    setPassword("");
    toast(t("twoFactorDisabled"));
  };

  const startRegenerate = () => {
    setPassword("");
    setError(null);
    setMode("regenerate");
  };

  const confirmRegenerate = async () => {
    setLoading(true);
    setError(null);
    const res = await regenerateBackupCodes(password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setBackupCodes(res.backupCodes);
    setRemaining(res.backupCodes.length);
    setMode("backupCodes");
    setPassword("");
    toast(t("backupCodesRegenerated"));
  };

  const copyAllCodes = async () => {
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

            {enabled && (
              <div className="mt-3 flex items-center gap-2">
                <KeyRound size={14} className="text-[var(--color-ink-soft)]" />
                <span className="text-xs font-bold text-[var(--color-ink-soft)]">
                  {t("backupCodesRemaining", { count: String(remaining) })}
                </span>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {enabled ? (
                <>
                  <Button
                    variant="glass"
                    icon={<RefreshCw size={15} />}
                    onClick={startRegenerate}
                  >
                    {t("regenerateBackupCodes")}
                  </Button>
                  <Button variant="glass" icon={<ShieldAlert size={15} />} onClick={startDisable}>
                    {t("disable2fa")}
                  </Button>
                </>
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
      <Modal open={mode === "setup"} onClose={cancelSetup} title={t("setupTitle")}>
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
            icon={<KeyRound size={15} />}
            onClick={goToBackupCodes}
            className="mt-2 w-full justify-center"
          >
            {t("viewBackupCodes")}
          </Button>
          <Button variant="ghost" onClick={cancelSetup} className="w-full justify-center">
            {t("cancel")}
          </Button>
        </div>
      </Modal>

      {/* مودال Backup Codes: نمایش ۱۰ کد بازیابی */}
      <Modal open={mode === "backupCodes"} onClose={cancelSetup} title={t("backupCodesTitle")}>
        <div className="flex flex-col gap-4">
          <p className="text-center text-xs text-[var(--color-ink-soft)]">{t("backupCodesHint")}</p>

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/20 p-4">
            {backupCodes.map((code, i) => (
              <div
                key={i}
                className="rounded-lg bg-white/40 px-3 py-2 text-center font-mono text-sm font-extrabold"
              >
                {code}
              </div>
            ))}
          </div>

          <Button
            icon={copied ? <Check size={15} /> : <Copy size={15} />}
            onClick={copyAllCodes}
            className="w-full justify-center"
          >
            {copied ? t("copied") : t("copyAllCodes")}
          </Button>

          {mode === "backupCodes" && secret && (
            <Button icon={<QrCode size={15} />} onClick={goToConfirm} className="w-full justify-center">
              {t("next")}
            </Button>
          )}

          <Button variant="ghost" onClick={() => setMode("setup")} className="w-full justify-center">
            {t("back")}
          </Button>
        </div>
      </Modal>

      {/* مودال Confirm: وارد کردن کد TOTP */}
      <Modal open={mode === "confirm"} onClose={() => setMode("backupCodes")} title={t("confirmTitle")}>
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
            <Button variant="ghost" onClick={() => setMode("backupCodes")}>
              {t("back")}
            </Button>
            <Button onClick={confirm}>
              {loading ? t("loading") : t("verifyAndEnable")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* مودال Disable */}
      <Modal open={mode === "disable"} onClose={() => setMode("idle")} title={t("disableTitle")}>
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

      {/* مودال Regenerate */}
      <Modal open={mode === "regenerate"} onClose={() => setMode("idle")} title={t("regenerateTitle")}>
        <div className="flex flex-col gap-4">
          <p className="text-xs text-[var(--color-ink-soft)]">{t("regenerateHint")}</p>
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
            <Button onClick={confirmRegenerate}>
              {loading ? t("loading") : t("confirmRegenerate")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}