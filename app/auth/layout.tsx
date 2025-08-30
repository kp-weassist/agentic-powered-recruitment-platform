"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary to-secondary relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-20 left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-secondary/20 blur-3xl"
            animate={{
              x: [0, -30, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <Link href="/" className="mb-12">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                <Brain className="h-8 w-8" />
              </div>
              <span className="text-2xl font-bold">WeAssist</span>
            </div>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold mb-6 ">
              Welcome to the Future of Recruitment
            </h1>
            <p className="text-lg text-white/90 mb-8">
              Join thousands of companies using AI to find perfect candidates 70% faster.
            </p>

            <div className="space-y-4">
              {[
                "AI-powered candidate matching",
                "Integrated assessment platform",
                "Real-time collaboration tools",
                "LinkedIn deep integration",
              ].map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="p-1 bg-white/20 rounded">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="text-white/90">{feature}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 p-6 bg-white/10 backdrop-blur rounded-xl border border-white/20"
            >
              <p className="text-white/90 italic mb-4">
                "WeAssist transformed our hiring process. We're finding better candidates in a fraction of the time."
              </p>
              <div>
                <p className="font-semibold">Sarah Chen</p>
                <p className="text-sm text-white/70">VP of Talent, TechCorp</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Top Navigation */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            
            {/* Mobile Logo */}
            <div className="lg:hidden">
              <Link href="/" className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">WeAssist</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Auth Content */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}