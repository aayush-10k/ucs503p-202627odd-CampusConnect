"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  User, Mail, Lock, KeyRound, Eye, EyeOff,
  AlertTriangle, CheckCircle2, GraduationCap, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Role = "STUDENT" | "TEACHER";

interface FieldErrors {
  name?: string[];
  email?: string[];
  password?: string[];
  role?: string[];
  general?: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT" as Role,
    department: "",
    batch: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);

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
          role: form.role,
          department: form.department || undefined,
          batch: form.batch || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) setErrors(data.errors as FieldErrors);
        else setErrors({ general: data.message ?? "Registration failed. Please try again." });
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

  return (
    <Card>
      <CardHeader>
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/40 mb-3 shadow-sm">
          <GraduationCap className="w-6 h-6" strokeWidth={2.2} />
        </div>
        <CardTitle>Join CampusConnect</CardTitle>
        <CardDescription>Create your campus account to get started</CardDescription>
      </CardHeader>

      <CardContent>
        {/* General error alert */}
        {errors.general && (
          <div
            className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs font-medium"
            role="alert"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Success alert */}
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
          {/* Full Name */}
          <Input
            id="reg-name"
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

          {/* Email Address */}
          <Input
            id="reg-email"
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

          {/* Password with Strength Indicator */}
          <div className="space-y-1.5">
            <Input
              id="reg-password"
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
            id="reg-confirm"
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

          {/* Role selector */}
          <div className="space-y-1.5 text-left">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              I am a…
            </span>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Account role">
              {(
                [
                  { value: "STUDENT", label: "Student", desc: "Collaborate & Learn", Icon: GraduationCap },
                  { value: "TEACHER", label: "Teacher", desc: "Manage & Instruct", Icon: BookOpen },
                ] as const
              ).map(({ value, label, desc, Icon }) => {
                const isSelected = form.role === value;
                return (
                  <label
                    key={value}
                    htmlFor={`role-${value}`}
                    className={cn(
                      "flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-center",
                      isSelected
                        ? "border-rose-600 bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 hover:bg-slate-100/50"
                    )}
                  >
                    <input
                      id={`role-${value}`}
                      type="radio"
                      name="role"
                      value={value}
                      checked={isSelected}
                      onChange={() => update("role", value)}
                      className="sr-only"
                      disabled={isLoading}
                    />
                    <Icon className={cn("w-6 h-6 mb-1.5", isSelected ? "text-rose-600 dark:text-rose-400" : "text-slate-400")} />
                    <span className="text-xs font-bold leading-tight">{label}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{desc}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Department & Batch (Optional) */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="reg-dept"
              label="Department"
              type="text"
              placeholder="e.g. CSE"
              value={form.department}
              onChange={(e) => update("department", e.target.value)}
              disabled={isLoading}
              helperText="Optional"
            />
            <Input
              id="reg-batch"
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
              id="register-submit-btn"
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Create account
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
