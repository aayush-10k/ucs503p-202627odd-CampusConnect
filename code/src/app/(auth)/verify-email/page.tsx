import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Clock, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Verify Your Email — CampusConnect",
  description: "Check your email to verify your CampusConnect account.",
};

export default function VerifyEmailPage() {
  return (
    <Card>
      <CardHeader>
        {/* Animated envelope & verification badge */}
        <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/40 shadow-sm">
            <Mail className="w-8 h-8" strokeWidth={1.8} />
          </div>
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={3} />
          </div>
        </div>

        <CardTitle>Check your inbox</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification link to your email address. Click it to activate your CampusConnect account.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Information box */}
        <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>Check your spam or junk folder if you don&apos;t see the message within a few moments.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>The link expires in <strong className="text-slate-800 dark:text-slate-200">24 hours</strong>.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>Your account remains pending until your email address is verified.</span>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-2">
          <Link href="/login" className="block w-full">
            <Button
              id="verify-to-login-btn"
              variant="primary"
              size="lg"
              className="w-full gap-2"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardContent>

      <CardFooter>
        <div className="w-full space-y-2">
          <p className="text-slate-600 dark:text-slate-400">
            Wrong email?{" "}
            <Link
              href="/register"
              className="font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline underline-offset-4"
            >
              Register again
            </Link>
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Need help?{" "}
            <a
              href="mailto:support@campus.edu"
              className="hover:underline underline-offset-2"
            >
              Contact support
            </a>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
