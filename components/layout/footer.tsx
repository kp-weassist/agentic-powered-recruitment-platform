"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Twitter,
  Linkedin,
  Github,
  Mail,
  MapPin,
  Phone,
  ArrowRight,
  Heart
} from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Integrations", href: "/integrations" },
      { label: "API", href: "/api" },
    ],
    Company: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
      { label: "Press", href: "/press" },
    ],
    Resources: [
      { label: "Documentation", href: "/docs" },
      { label: "Help Center", href: "/help" },
      { label: "Community", href: "/community" },
      { label: "Templates", href: "/templates" },
    ],
    Legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "GDPR", href: "/gdpr" },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
    { icon: Github, href: "https://github.com", label: "GitHub" },
  ];

  return (
    <footer className="bg-muted/30 border-t">
      {/* Newsletter Section */}
      <div className="border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Stay ahead in recruitment
            </h3>
            <p className="text-muted-foreground mb-6">
              Get the latest AI recruitment insights and product updates delivered to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1"
                required
              />
              <Button type="submit" className="group">
                Subscribe
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-3">
              By subscribing, you agree to our Privacy Policy and consent to receive updates.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">
                WeAssist
              </span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-xs">
              AI-powered recruitment platform that helps you find perfect candidates 70% faster.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:hello@weassist.ai" className="hover:text-foreground">
                  hello@weassist.ai
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+1234567890" className="hover:text-foreground">
                  +1 (234) 567-890
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-foreground mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>© {currentYear} WeAssist. Made with</span>
            <Heart className="h-3 w-3 text-destructive fill-destructive" />
            <span>by the WeAssist team</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5" />
              </motion.a>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-muted" />
              <span>SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-muted" />
              <span>GDPR Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-muted" />
              <span>ISO 27001</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-muted" />
              <span>CCPA Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}