"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  User, Mail, Lock, KeyRound, Eye, EyeOff,
  AlertTriangle, CheckCircle2, Ticket, ShieldAlert,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface TokenInfo {
  valid: boolean;
  role?: string;
  label?: string;
  expiresAt?: string;
  reason?: string;
}

interface FieldErrors {
  name?: string[];
  email?: string[];
  password?: string[];
  general?: string;
}

export default function JoinPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    batch: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function validateToken() {
      try {
        const res = await fetch(`/api/admin/invite/validate?token=${token}`);
        const data = await res.json();
        setTokenInfo(data);
      } catch {
        setTokenInfo({ valid: false, reason: "Failed to validate invite link." });
      } finally {
        setTokenLoading(false);
      }
    }
    validateToken();
  }, [token]);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined, general: undefined }));
  }

  function validateClient(): boolean {
    const errs: FieldErrors = {};
    if (form.name.trim().length < 2) errs.name = ["Name must be at least 2 characters."];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = ["Enter a valid email address."];
    if (form.password.length < 8) errs.password = ["Password must be at least 8 characters."];
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      errs.password = ["Must contain uppercase, lowercase, and a number."];
    if (form.password !== form.confirmPassword) errs.general = "Passwords do not match.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateClient()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: tokenInfo?.role ?? "STUDENT",
          department: form.department || undefined,
          batch: form.batch || undefined,
          inviteToken: token,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) setErrors(data.errors as FieldErrors);
        else setErrors({ general: data.message ?? "Failed to join. Please try again." });
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      const result = await signIn("credentials", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        redirect: false,
        callbackUrl: "/feed",
      });

      if (result?.ok) {
        router.push("/feed");
        router.refresh();
      } else {
        router.push("/login?registered=true");
      }
    } catch {
      setErrors({ general: "Network error. Please check your connection and try again." });
      setIsLoading(false);
    }
  }

  // Password strength calculation
  const strength = (() => {
    if (!form.password) return 0;
    let s = 0;
    if (form.password.length >= 8) s++;
    if (/[A-Z]/.test(form.password)) s++;
    if (/[0-9]/.test(form.password)) s++;
    if (/[^A-Za-z0-9]/.test(form.password)) s++;
    return s;
  })();

  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthBg = ["", "bg-red-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"];
  const strengthText = ["", "text-red-500", "text-amber-500", "text-emerald-500", "text-emerald-600"];

  if (tokenLoading) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Validating invitation link…</p>
        </div>
      </Card>
    );
  }

  if (!tokenInfo?.valid) {
    return (
      <Card>
        <CardHeader>
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto mb-3 border border-red-200 dark:border-red-900/50">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <CardTitle>Invalid or Expired Link</CardTitle>
          <CardDescription>
            {tokenInfo?.reason || "This invite link is no longer active or valid."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 text-center mb-4">
            Please ask your campus administrator for a new invitation link or sign in if you already have an account.
          </p>
          <Link href="/login" className="block w-full">
            <Button variant="primary" size="lg" className="w-full">
              Go to Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/40 mb-3 shadow-sm">
          <Ticket className="w-6 h-6" strokeWidth={2.2} />
        </div>
        <CardTitle>Special Campus Invitation</CardTitle>
        <CardDescription>
          You&apos;ve been invited to join CampusConnect
        </CardDescription>

        {/* Assigned role badge */}
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold text-rose-700 dark:text-rose-300">
          <span>Role: <strong>{tokenInfo.role}</strong></span>
          {tokenInfo.label && <span>• {tokenInfo.label}</span>}
        </div>
      </CardHeader>

      <CardContent>
        {/* Errors & Success */}
        {errors.general && (
          <div
            className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs font-medium"
            role="alert"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errors.general}</span>
          </div>
        )}

        {success && (
          <div
            className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium"
            role="status"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Account created! Signing you in…</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Name */}
          <Input
            id="join-name"
            label="Full Name"
            type="text"
            autoComplete="name"
            required
            placeholder="Your full name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            disabled={isLoading}
            error={errors.name?.[0]}
            leftIcon={<User className="w-4 h-4" />}
          />

          {/* Email */}
          <Input
            id="join-email"
            label="Email Address"
            type="email"
            autoComplete="email"
            required
            placeholder="you@campus.edu"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            disabled={isLoading}
            error={errors.email?.[0]}
            leftIcon={<Mail className="w-4 h-4" />}
          />

          {/* Password */}
          <div className="space-y-1.5">
            <Input
              id="join-password"
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              disabled={isLoading}
              error={errors.password?.[0]}
              leftIcon={<KeyRound className="w-4 h-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 focus:outline-none cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {form.password && (
              <div className="pt-1 space-y-1">
                <div className="flex items-center gap-1.5 h-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-full flex-1 rounded-full transition-all duration-300",
                        i <= strength ? strengthBg[strength] : "bg-slate-200 dark:bg-slate-800"
                      )}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Password strength</span>
                  <span className={cn("font-semibold", strengthText[strength])}>
                    {strengthLabels[strength]}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <Input
            id="join-confirm"
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Repeat your password"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            disabled={isLoading}
            leftIcon={<Lock className="w-4 h-4" />}
          />

          {/* Department & Batch */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="join-dept"
              label="Department"
              type="text"
              placeholder="e.g. CSE"
              value={form.department}
              onChange={(e) => update("department", e.target.value)}
              disabled={isLoading}
              helperText="Optional"
            />
            <Input
              id="join-batch"
              label="Batch"
              type="text"
              placeholder="e.g. 2024"
              value={form.batch}
              onChange={(e) => update("batch", e.target.value)}
              disabled={isLoading}
              helperText="Optional"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              id="join-submit-btn"
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Join CampusConnect
            </Button>
          </div>
        </form>
      </CardContent>

      <CardFooter>
        <p className="text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
