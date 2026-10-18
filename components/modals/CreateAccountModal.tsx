"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { KeyRound } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { createStudentAccount } from "@/lib/server/auth-actions";
import { mapZodErrors } from "@/lib/format";

export default function CreateAccountModal({
    open,
    onClose,
    studentId,
    studentName,
}: {
    open: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
}) {
    const t = useTranslations("Student");
    const tf = useTranslations("Forms");
    const toast = useToast();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const schema = z.object({
        email: z.string().trim().min(1, "required").email("invalid"),
        password: z.string().min(8, "shortPassword"),
    });

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = schema.safeParse({ email, password });
        if (!res.success) {
            setErrors(mapZodErrors(res.error.issues));
            return;
        }
        const r = await createStudentAccount({ studentId, email: res.data.email, password: res.data.password });
        if (!r.ok) {
            setErrors({ form: r.error });
            return;
        }
        toast(t("accountCreated"));
        setEmail("");
        setPassword("");
        setErrors({});
        onClose();
    };

    const err = (k: string) => (errors[k] ? t(`errors.${errors[k]}`) : undefined);

    return (
        <Modal open={open} onClose={onClose} title={t("accountTitle", { name: studentName })}>
            <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
                <div className="flex items-center gap-2 rounded-xl bg-white/25 px-4 py-3 text-xs font-bold text-[var(--color-ink-soft)]">
                    <KeyRound size={15} />
                    {t("accountHint")}
                </div>

                <TextField label={t("email")} type="email" placeholder="student@class.ir" value={email} error={err("email")} onChange={(e) => setEmail(e.target.value)} />
                <TextField label={t("password")} type="password" placeholder="••••••••" value={password} error={err("password")} onChange={(e) => setPassword(e.target.value)} />

                {errors.form && (
                    <p className="rounded-xl bg-[rgba(217,79,99,0.12)] px-4 py-2.5 text-xs font-bold text-[#B23A4C]">
                        {t(`errors.${errors.form}`)}
                    </p>
                )}

                <div className="mt-2 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>{tf("cancel")}</Button>
                    <Button type="submit">{tf("submit")}</Button>
                </div>
            </form>
        </Modal>
    );
}