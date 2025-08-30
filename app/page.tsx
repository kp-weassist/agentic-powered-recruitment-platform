"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Sparkles, 
  Users, 
  Zap, 
  Shield, 
  BarChart3, 
  Clock,
  ArrowRight,
  CheckCircle,
  Globe,
  Building,
  Target,
  Briefcase,
  Brain,
  TrendingUp
} from "lucide-react";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 opacity-50" />
          <motion.div
            className="absolute -top-1/2 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute -bottom-1/2 right-1/4 h-96 w-96 rounded-full bg-secondary/20 blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, 100, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Badge */}
            <Badge className="mb-8 bg-secondary/10 text-secondary border-secondary/20 px-4 py-1">
              <Sparkles className="mr-2 h-3 w-3" />
              AI-Powered Recruitment Platform
            </Badge>

            {/* Heading */}
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Hire Smarter with
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> AI-Driven </span>
              Matching
            </h1>

            {/* Subheading */}
            <p className="mx-auto mb-10 max-w-3xl text-lg text-muted-foreground sm:text-xl">
              Reduce time-to-hire by 70% with intelligent candidate matching, integrated assessments, 
              and seamless collaboration tools. Join 500+ companies transforming their recruitment process.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/sign-up">
                <Button size="lg" className="group shadow-md hover:shadow-lg">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button size="lg" variant="outline" className="shadow-sm hover:shadow-md">
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
              {[
                { label: "Time Saved", value: "70%", icon: Clock },
                { label: "Match Accuracy", value: "85%", icon: Target },
                { label: "Active Companies", value: "500+", icon: Building },
                { label: "Candidates Matched", value: "100K+", icon: Users },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="mx-auto mb-2 h-8 w-8 text-primary" />
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
              Everything You Need to Hire Better
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI-native platform combines powerful features to streamline your entire recruitment process.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Brain,
                title: "AI-Powered Matching",
                description: "Our advanced AI analyzes skills, experience, and culture fit to find perfect matches in seconds.",
                color: "text-primary",
                bgColor: "bg-primary/10",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Reduce time-to-hire from 42 days to just 15 days with automated workflows and smart screening.",
                color: "text-secondary",
                bgColor: "bg-secondary/10",
              },
              {
                icon: Shield,
                title: "Bias-Free Hiring",
                description: "Ensure fair evaluation with blind assessments and AI-validated diversity metrics.",
                color: "text-accent",
                bgColor: "bg-accent/10",
              },
              {
                icon: Users,
                title: "Team Collaboration",
                description: "Real-time feedback, shared notes, and collaborative decision-making for your hiring team.",
                color: "text-primary",
                bgColor: "bg-primary/10",
              },
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                description: "Track metrics, optimize your funnel, and make data-driven hiring decisions.",
                color: "text-secondary",
                bgColor: "bg-secondary/10",
              },
              {
                icon: Globe,
                title: "LinkedIn Integration",
                description: "Deep integration with LinkedIn for seamless profile import and job posting.",
                color: "text-accent",
                bgColor: "bg-accent/10",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-border/50">
                  <div className={`inline-flex p-3 rounded-lg ${feature.bgColor} mb-4`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes and transform your hiring process in three simple steps.
            </p>
          </motion.div>

          <div className="grid gap-12 lg:grid-cols-3">
            {[
              {
                step: "1",
                title: "Post Your Job",
                description: "Create job postings with AI assistance and publish to multiple channels instantly.",
                icon: Briefcase,
              },
              {
                step: "2",
                title: "AI Matches Candidates",
                description: "Our AI analyzes applications and ranks candidates based on fit and potential.",
                icon: Brain,
              },
              {
                step: "3",
                title: "Hire Top Talent",
                description: "Collaborate with your team, conduct assessments, and make confident hiring decisions.",
                icon: TrendingUp,
              },
            ].map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                {index < 2 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full">
                    <svg className="w-full h-2" viewBox="0 0 100 8" fill="none">
                      <path
                        d="M0 4 L95 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        className="text-muted-foreground/30"
                      />
                      <path
                        d="M95 1 L100 4 L95 7"
                        fill="currentColor"
                        className="text-muted-foreground/30"
                      />
                    </svg>
                  </div>
                )}
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="text-2xl font-bold">{step.step}</span>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
              Loved by Recruiters Worldwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of companies that have transformed their hiring process.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                quote: "WeAssist reduced our time-to-hire by 65% and helped us find amazing talent we would have missed otherwise.",
                author: "Sarah Chen",
                role: "VP of Talent, TechCorp",
                rating: 5,
              },
              {
                quote: "The AI matching is incredibly accurate. It's like having a team of expert recruiters working 24/7.",
                author: "Michael Rodriguez",
                role: "HR Director, StartupXYZ",
                rating: 5,
              },
              {
                quote: "Finally, an ATS that actually makes our job easier. The interface is intuitive and the features are powerful.",
                author: "Emily Thompson",
                role: "Recruiting Manager, FinanceHub",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 h-full bg-card/50 backdrop-blur">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg
                        key={i}
                        className="h-5 w-5 text-primary"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="mb-4 text-muted-foreground italic">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-secondary p-12 text-center shadow-2xl"
          >
            <div className="relative z-10">
              <h2 className="mb-4 text-3xl font-bold text-primary-foreground sm:text-4xl">
                Ready to Transform Your Hiring?
              </h2>
              <p className="mb-8 text-lg text-primary-foreground/90">
                Start your free trial today and experience the future of recruitment.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth/sign-up">
                  <Button size="lg" variant="secondary" className="shadow-lg hover:shadow-xl">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                    Talk to Sales
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center gap-8 text-primary-foreground/80">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>14-day free trial</span>
                </div>
              </div>
            </div>
            {/* Background decoration */}
            <div className="absolute inset-0 -z-0">
              <div className="absolute -left-1/4 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -right-1/4 bottom-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}