"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  Github,
  Chrome,
  User,
  Building,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agreeToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company: company,
          },
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
      toast.success("Account created successfully");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignup = async (provider: 'github' | 'google') => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      toast.success("Account created successfully");
      setError(error instanceof Error ? error.message : "An error occurred");
      setIsLoading(false);
    }
  };

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const getPasswordStrengthColor = () => {
    const strength = passwordStrength(password);
    if (strength === 0) return "";
    if (strength <= 1) return "bg-destructive";
    if (strength <= 2) return "bg-yellow-500";
    if (strength <= 3) return "bg-primary";
    return "bg-secondary";
  };

  const getPasswordStrengthText = () => {
    const strength = passwordStrength(password);
    if (strength === 0) return "";
    if (strength <= 1) return "Weak";
    if (strength <= 2) return "Fair";
    if (strength <= 3) return "Good";
    return "Strong";
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Join thousands of companies finding perfect candidates
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-9 h-11"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium">
                Company
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company"
                  type="text"
                  placeholder="Acme Inc"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="pl-9 h-11"
                  disabled={isLoading}
                />
              </div>
            </div> */}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Work email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-11"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-10 h-11"
                disabled={isLoading}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {password && (
              <div className="space-y-2">
                <div className="flex gap-1 h-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex-1 rounded-full transition-all",
                        i < passwordStrength(password)
                          ? getPasswordStrengthColor()
                          : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Password strength: {getPasswordStrengthText()}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-9 pr-10 h-11"
                disabled={isLoading}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
            {confirmPassword && password === confirmPassword && confirmPassword.length >= 8 && (
              <div className="flex items-center gap-1 text-xs text-secondary">
                <CheckCircle className="h-3 w-3" />
                <span>Passwords match</span>
              </div>
            )}
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={agreeToTerms}
              onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
              disabled={isLoading}
              className="mt-1"
            />
            <Label
              htmlFor="terms"
              className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
            >
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-primary hover:underline underline-offset-4"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-primary hover:underline underline-offset-4"
              >
                Privacy Policy
              </Link>
            </Label>
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
            disabled={isLoading || !agreeToTerms}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        {/* <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or sign up with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => handleOAuthSignup('github')}
            disabled={isLoading}
            className="h-11"
          >
            <Github className="mr-2 h-4 w-4" />
            GitHub
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOAuthSignup('google')}
            disabled={isLoading}
            className="h-11"
          >
            <Chrome className="mr-2 h-4 w-4" />
            Google
          </Button>
        </div> */}

        <div className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-primary hover:underline underline-offset-4 font-medium"
          >
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}