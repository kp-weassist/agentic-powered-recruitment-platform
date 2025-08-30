"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Mail, 
  Loader2, 
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Send
} from "lucide-react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setIsSubmitted(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
            <CheckCircle className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            Check your email
          </h1>
          <p className="text-muted-foreground mb-6">
            We've sent a password reset link to
            <br />
            <span className="font-medium text-foreground">{email}</span>
          </p>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setIsSubmitted(false);
                setEmail("");
              }}
              className="w-full"
            >
              Try another email
            </Button>
            <Link href="/auth/login" className="block">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Forgot your password?
        </h1>
        <p className="text-sm text-muted-foreground">
          No worries! Enter your email and we'll send you reset instructions
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-11"
                disabled={isLoading}
                autoFocus
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full h-11" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending reset link...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send reset link
              </>
            )}
          </Button>

          <Link href="/auth/login">
            <Button variant="ghost" className="w-full h-11">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </Link>
        </form>

        <div className="mt-8 rounded-lg bg-muted/50 p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">
            Password reset tips:
          </h3>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• The reset link will expire in 1 hour</li>
            <li>• Check your spam folder if you don't see the email</li>
            <li>• Make sure you entered the correct email address</li>
            <li>• Contact support if you continue to have issues</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}