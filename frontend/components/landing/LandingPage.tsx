"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "../../lib/theme-context";
import { useUser } from "@clerk/nextjs";
import {
  Bot,
  FileText,
  Zap,
  LifeBuoy,
  ArrowRight,
  CheckCircle,
  MessageSquare,
  Shield,
  BarChart3,
  ChevronRight,
  Sparkles,
  Globe,
  Clock,
  Users,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";

import Grainient from "../Grainient";

const HERO_COLORS = ["#0A0A0A", "#1a0306", "#5c0710", "#E30613"];

const FEATURES = [
  {
    icon: Bot,
    title: "AI Chatbot Engine",
    desc: "Powered by Groq LLM with sub-second response times. Your customers never wait.",
  },
  {
    icon: FileText,
    title: "Knowledge RAG",
    desc: "Upload company PDFs — the AI retrieves and cites exact passages to answer accurately.",
  },
  {
    icon: LifeBuoy,
    title: "Human Handoff",
    desc: "Smart escalation detector transfers to your support team when AI can't resolve the query.",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    desc: "Session isolation, workspace ownership checks, and Clerk SSO — enterprise-grade from day one.",
  },
  {
    icon: BarChart3,
    title: "Support Analytics",
    desc: "Track ticket volume, resolution rates, and chatbot effectiveness from a single dashboard.",
  },
  {
    icon: Globe,
    title: "Embeddable Widget",
    desc: "Drop one script tag into any website. Your AI assistant is live in under five minutes.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Create a Workspace",
    desc: "Sign up and configure your workspace with your business name and branding.",
  },
  {
    step: "02",
    title: "Upload Knowledge",
    desc: "Add your FAQs, policies, and product guides as PDFs. We chunk and embed them automatically.",
  },
  {
    step: "03",
    title: "Configure Your Bot",
    desc: "Set the system prompt, personality, and brand accent colour for your chatbot.",
  },
  {
    step: "04",
    title: "Go Live",
    desc: "Embed the widget on your site. Customers get instant AI answers — you get fewer tickets.",
  },
];

const STATS = [
  { value: "<1s", label: "Avg response time" },
  { value: "10x", label: "Faster than email" },
  { value: "87%", label: "First-contact resolution" },
  { value: "24/7", label: "Always online" },
];

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isSignedIn } = useUser();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
      {/* ── Navbar ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${scrolled
          ? "bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-white/10"
          : "bg-transparent"
          }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#E30613] rounded-[0.5px]" />
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-white">
              Converso
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-xs text-white/60 hover:text-white transition-colors">
              Features
            </a>
            <a href="#how" className="text-xs text-white/60 hover:text-white transition-colors">
              How it works
            </a>
            <a href="#pricing" className="text-xs text-white/60 hover:text-white transition-colors">
              Pricing
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-1.5 text-white/50 hover:text-white border border-white/10 hover:border-white/25 rounded-[1px] transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isSignedIn ? (
              <Link
                href="/dashboard"
                className="px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] bg-[#E30613] hover:bg-[#C50510] text-white rounded-[1px] transition-colors inline-flex items-center gap-1.5"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs font-medium text-white/70 hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] bg-[#E30613] hover:bg-[#C50510] text-white rounded-[1px] transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
            <Link
              href="/signup"
              className="px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] bg-[#E30613] hover:bg-[#C50510] text-white rounded-[1px] transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-1.5 text-white/70"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#111] border-t border-white/10 px-6 py-4 space-y-3">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/70 py-2">Features</a>
            <a href="#how" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/70 py-2">How it works</a>
            <Link href="/login" className="block text-sm text-white/70 py-2">Sign in</Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2 text-sm text-white/70 py-2"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <Link
              href="/signup"
              className="block w-full text-center py-2.5 text-sm font-semibold bg-[#E30613] text-white rounded-[1px]"
            >
              Get Started Free
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/10 rounded-[1px] text-[11px] font-mono text-white/50 mb-8">
            <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full animate-pulse" />
            Now live — RAG-powered support with instant human handoff
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            AI customer support.{" "}
            <span className="text-[#E30613]">Zero wait.</span>
          </h1>

          <p className="text-lg text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Converso deploys an AI assistant trained on your business knowledge — resolving
            80%+ of support queries instantly, and escalating the rest to your human team
            with full context.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold uppercase tracking-[0.06em] bg-[#E30613] hover:bg-[#C50510] text-white rounded-[1px] transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Start building free
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium border border-white/15 hover:border-white/30 text-white/70 hover:text-white rounded-[1px] transition-colors"
            >
              Sign in to dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="mt-4 text-[11px] text-white/30 font-mono">
            No credit card required · 1 workspace free forever
          </p>
        </div>

        {/* Dashboard mockup */}
        <div className="relative max-w-5xl mx-auto mt-20">
          <div className="border border-white/10 rounded-[2px] overflow-hidden bg-[#111] shadow-2xl">
            {/* Fake toolbar */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/10 bg-[#0D0D0D]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E30613]/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="ml-4 text-[10px] font-mono text-white/25">converso — dashboard</span>
            </div>

            {/* Fake dashboard */}
            <div className="flex">
              {/* Sidebar */}
              <div className="w-44 border-r border-white/5 p-3 space-y-1 shrink-0">
                {["Overview", "Chatbot", "Knowledge", "Tickets", "Playground"].map((item, i) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[1px] text-[10px] ${i === 0
                      ? "bg-white/5 text-white font-medium"
                      : "text-white/30"
                      }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 p-6 space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { l: "Chatbot Status", v: "ACTIVE" },
                    { l: "Open Tickets", v: "3" },
                    { l: "Total Tickets", v: "47" },
                    { l: "Knowledge", v: "CONNECTED" },
                  ].map((s) => (
                    <div key={s.l} className="border border-white/5 p-3 rounded-[1px]">
                      <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">{s.l}</p>
                      <p className="text-sm font-bold text-white">{s.v}</p>
                    </div>
                  ))}
                </div>

                {/* Quick action cards */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { t: "Configure Chatbot", s: "Set prompt & branding" },
                    { t: "Upload Documents", s: "PDF knowledge base" },
                  ].map((c) => (
                    <div key={c.t} className="border border-white/5 p-4 rounded-[1px]">
                      <p className="text-xs font-semibold text-white mb-1">{c.t}</p>
                      <p className="text-[10px] text-white/30">{c.s}</p>
                    </div>
                  ))}
                </div>

                {/* Ticket row */}
                <div className="border border-white/5 rounded-[1px] overflow-hidden">
                  <div className="px-4 py-2 border-b border-white/5 bg-white/3">
                    <p className="text-[9px] text-white/30 uppercase tracking-wider">Recent Tickets</p>
                  </div>
                  {["Refund request for order #4821", "Can't log into account"].map((t) => (
                    <div key={t} className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-0">
                      <p className="text-[10px] text-white/60">{t}</p>
                      <span className="text-[9px] px-1.5 py-0.5 bg-white/5 text-white/40 rounded-[1px]">open</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Glow under mockup */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-[#E30613]/5 blur-2xl rounded-full" />
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
            {STATS.map((s) => (
              <div key={s.label} className="py-8 px-6 text-center">
                <p className="text-3xl font-bold text-white mb-1">{s.value}</p>
                <p className="text-xs text-white/40 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-14">
            <p className="text-[11px] font-mono text-[#E30613] uppercase tracking-[0.12em] mb-3">
              Platform Capabilities
            </p>
            <h2 className="text-4xl font-bold text-white">
              Everything you need to
              <br />
              automate customer support.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-[#0A0A0A] p-8 group hover:bg-[#111] transition-colors"
                >
                  <div className="w-8 h-8 border border-white/10 rounded-[1px] flex items-center justify-center mb-5 group-hover:border-[#E30613]/40 transition-colors">
                    <Icon className="w-4 h-4 text-white/50 group-hover:text-[#E30613] transition-colors" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-24 px-6 border-t border-white/10 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <div className="mb-14">
            <p className="text-[11px] font-mono text-[#E30613] uppercase tracking-[0.12em] mb-3">
              Getting Started
            </p>
            <h2 className="text-4xl font-bold text-white">Live in four steps.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {HOW_IT_WORKS.map((item, idx) => (
              <div key={item.step} className="flex gap-6">
                <div className="shrink-0">
                  <span className="text-5xl font-bold text-white/5 font-mono">
                    {item.step}
                  </span>
                </div>
                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-mono text-[#E30613] uppercase tracking-[0.12em] mb-3">
              Pricing
            </p>
            <h2 className="text-4xl font-bold text-white">Simple, transparent pricing.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="border border-white/10 p-8 rounded-[2px]">
              <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-white/40 mb-4">Free</p>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-sm text-white/40 pb-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "1 workspace",
                  "1 AI chatbot",
                  "10 MB knowledge base",
                  "100 chat sessions / mo",
                  "Support ticket inbox",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-xs text-white/60">
                    <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center py-2.5 text-xs font-semibold uppercase tracking-[0.06em] border border-white/15 hover:border-white/30 text-white/70 hover:text-white rounded-[1px] transition-colors"
              >
                Start for free
              </Link>
            </div>

            {/* Pro */}
            <div className="border border-[#E30613]/40 p-8 rounded-[2px] relative bg-[#E30613]/[0.03]">
              <span className="absolute top-4 right-4 text-[9px] px-2 py-0.5 bg-[#E30613] text-white font-mono uppercase tracking-wider rounded-[1px]">
                Popular
              </span>
              <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#E30613] mb-4">Pro</p>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-bold text-white">$29</span>
                <span className="text-sm text-white/40 pb-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited workspaces",
                  "Multiple chatbots",
                  "500 MB knowledge base",
                  "Unlimited chat sessions",
                  "Priority ticket routing",
                  "API access & embed widget",
                  "Analytics dashboard",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-xs text-white/60">
                    <CheckCircle className="w-3.5 h-3.5 text-[#E30613] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center py-2.5 text-xs font-semibold uppercase tracking-[0.06em] bg-[#E30613] hover:bg-[#C50510] text-white rounded-[1px] transition-colors"
              >
                Start Pro trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 border-t border-white/10 bg-white/[0.01]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to automate your support?
          </h2>
          <p className="text-sm text-white/40 mb-8 leading-relaxed">
            Join teams using Converso to cut response times, reduce ticket volume, and
            give customers instant answers — any time, any timezone.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.06em] bg-[#E30613] hover:bg-[#C50510] text-white rounded-[1px] transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Create your free workspace
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#E30613] rounded-[0.5px]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
              Converso
            </span>
          </div>
          <p className="text-[10px] text-white/25 font-mono">
            © 2026 Converso. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-[10px] text-white/30 hover:text-white/60 transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="text-[10px] text-white/30 hover:text-white/60 transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
