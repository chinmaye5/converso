"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useWorkspace } from "../../lib/workspace-context";
import { getChatbot, createChatbot, updateChatbot } from "../../lib/api";
import type { Chatbot } from "../../lib/types";
import { PageHeader } from "../ui/PageHeader";
import { PageLoadingSkeleton } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import { EmptyState } from "../ui/EmptyState";
import {
  Check,
  Send,
  Sparkles,
  RefreshCw,
  Copy,
  ExternalLink,
  Link2,
} from "lucide-react";

export function ChatbotSettingsView() {
  const { getToken } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();

  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Form states
  const [name, setName] = useState("Support Assistant");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful customer support assistant. Answer using the business knowledge provided.",
  );
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [isActive, setIsActive] = useState(true);

  const loadBot = useCallback(async () => {
    if (!currentWorkspace) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) return;

      const bot = await getChatbot(token, currentWorkspace.id);
      if (bot) {
        setChatbot(bot);
        setName(bot.name);
        setSystemPrompt(bot.systemPrompt);
        setPrimaryColor(bot.primaryColor);
        setIsActive(bot.isActive);
      } else {
        // Defaults
        setName("Support Assistant");
        setSystemPrompt(
          "You are a helpful customer support assistant. Answer using the business knowledge provided.",
        );
        setPrimaryColor("#2563eb");
        setIsActive(true);
      }
    } catch (err) {
      console.error("Failed to load chatbot:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load chatbot settings",
      );
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, getToken]);

  useEffect(() => {
    loadBot();
  }, [loadBot]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!currentWorkspace) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      let savedBot: Chatbot;
      if (chatbot) {
        savedBot = await updateChatbot(token, currentWorkspace.id, {
          name: name.trim(),
          systemPrompt: systemPrompt.trim(),
          primaryColor: primaryColor.trim(),
          isActive,
        });
      } else {
        // Create then update if prompt/color differ
        savedBot = await createChatbot(token, currentWorkspace.id, name.trim());
        savedBot = await updateChatbot(token, currentWorkspace.id, {
          name: name.trim(),
          systemPrompt: systemPrompt.trim(),
          primaryColor: primaryColor.trim(),
          isActive,
        });
      }

      setChatbot(savedBot);
      setSuccessMessage("Chatbot configuration saved successfully.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Save error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save configuration",
      );
    } finally {
      setSaving(false);
    }
  }

  const publicChatUrl = chatbot?.id
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/chat/${chatbot.id}`
    : null;

  function handleCopyLink() {
    if (!publicChatUrl) return;
    navigator.clipboard.writeText(publicChatUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  }

  if (wsLoading || (loading && !chatbot && !error)) {
    return <PageLoadingSkeleton />;
  }

  if (!currentWorkspace) {
    return (
      <EmptyState
        section="Chatbot Setup"
        title="No Workspace Selected"
        description="Select or create a workspace before configuring your AI chatbot."
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        section="Chatbot Configuration"
        title="Assistant Settings"
        description="Define assistant personality, system prompt boundaries, and customer-facing visual identity."
      />

      {error && (
        <ErrorState
          title="Configuration Error"
          message={error}
          onRetry={loadBot}
        />
      )}

      {successMessage && (
        <div className="border border-[#16A34A]/40 bg-[#16A34A]/5 p-4 rounded-[1px] flex items-center gap-2.5 text-xs text-[#16A34A] font-medium">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Configuration Form */}
        <div className="lg:col-span-7 bg-white border border-[#E5E5E5] p-6 md:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Assistant Name */}
            <div>
              <label
                htmlFor="bot-name"
                className="block text-xs font-medium uppercase tracking-[0.05em] text-[#0A0A0A] mb-1.5"
              >
                Assistant Name
              </label>
              <input
                id="bot-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                placeholder="e.g. Acme Support Assistant"
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5E5] text-[#0A0A0A] placeholder-[#A3A3A3] focus:outline-none focus:ring-1 focus:ring-[#E30613] rounded-[1px]"
              />
              <p className="text-[11px] text-[#737373] mt-1">
                Displayed in the chat header and conversation responses (1–100 chars).
              </p>
            </div>

            {/* System Prompt */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="bot-prompt"
                  className="block text-xs font-medium uppercase tracking-[0.05em] text-[#0A0A0A]"
                >
                  System Prompt Instructions
                </label>
                <span className="text-[11px] text-[#737373] font-mono tabular-nums">
                  {systemPrompt.length} / 10,000
                </span>
              </div>
              <textarea
                id="bot-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                maxLength={10000}
                rows={6}
                required
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#E5E5E5] text-[#0A0A0A] placeholder-[#A3A3A3] focus:outline-none focus:ring-1 focus:ring-[#E30613] rounded-[1px] leading-relaxed resize-y"
              />
              <p className="text-[11px] text-[#737373] mt-1">
                Instruction prompt sent to Groq. Defines boundaries, tone of voice, and guidelines.
              </p>
            </div>

            {/* Brand Color & Active Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-[#E5E5E5]">
              {/* Brand Accent Color */}
              <div>
                <label
                  htmlFor="bot-color"
                  className="block text-xs font-medium uppercase tracking-[0.05em] text-[#0A0A0A] mb-1.5"
                >
                  Brand Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="bot-color-picker"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 p-0 border border-[#E5E5E5] rounded-[1px] cursor-pointer bg-white"
                  />
                  <input
                    id="bot-color"
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    pattern="^#[0-9a-fA-F]{6}$"
                    maxLength={7}
                    required
                    className="w-28 px-3 py-1.5 text-xs font-mono bg-white border border-[#E5E5E5] text-[#0A0A0A] rounded-[1px] focus:outline-none focus:ring-1 focus:ring-[#E30613]"
                  />
                </div>
                <p className="text-[11px] text-[#737373] mt-1">
                  Hex color used for widget accents and header branding.
                </p>
              </div>

              {/* Active Toggle */}
              <div>
                <label
                  htmlFor="bot-status"
                  className="block text-xs font-medium uppercase tracking-[0.05em] text-[#0A0A0A] mb-1.5"
                >
                  Availability Status
                </label>
                <label className="flex items-center gap-2.5 mt-2 cursor-pointer select-none">
                  <input
                    id="bot-status"
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#E30613] rounded-[1px] border-[#E5E5E5] focus:ring-[#E30613]"
                  />
                  <span className="text-xs font-medium text-[#0A0A0A]">
                    {isActive ? "Active (Online)" : "Inactive (Offline)"}
                  </span>
                </label>
                <p className="text-[11px] text-[#737373] mt-1">
                  When inactive, public visitor chat requests are paused.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#E5E5E5] flex items-center justify-between">
              <button
                type="button"
                onClick={loadBot}
                disabled={saving}
                className="px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.04em] text-[#737373] hover:text-[#0A0A0A] transition-colors rounded-[1px] inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-medium uppercase tracking-[0.06em] bg-[#0A0A0A] hover:bg-[#262626] text-white transition-colors rounded-[1px] disabled:opacity-50"
              >
                {saving ? "Saving Configuration..." : "Save Configuration"}
              </button>
            </div>
          </form>
        </div>

        {/* Right column: Preview + Share Link */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#737373]">
              Live Widget Preview
            </p>
            <span className="text-[11px] text-[#737373]">
              Simulated Display
            </span>
          </div>

          {/* Neutral outer frame per Swiss spec, brand color only inside */}
          <div className="bg-white border border-[#E5E5E5] p-1 rounded-[1px]">
            <div className="border border-[#E5E5E5] overflow-hidden flex flex-col h-[460px] bg-[#FAFAFA]">
              {/* Simulated Widget Header with primaryColor */}
              <div
                className="p-3.5 text-white flex items-center justify-between shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight">{name}</p>
                    <p className="text-[10px] text-white/80 leading-none">
                      {isActive ? "Online • Ready to assist" : "Offline"}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-[1px] bg-black/20 text-white font-mono">
                  AI
                </span>
              </div>

              {/* Simulated Chat Feed */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto text-xs">
                {/* Bot Greeting */}
                <div className="flex flex-col items-start max-w-[85%]">
                  <span className="text-[9px] font-mono text-[#737373] uppercase mb-1">
                    {name}
                  </span>
                  <div className="p-3 bg-white border border-[#E5E5E5] text-[#0A0A0A] rounded-[1px] leading-relaxed">
                    Hello! I&apos;m your assistant for {currentWorkspace.name}. How can I assist you today?
                  </div>
                </div>

                {/* Simulated Customer Question */}
                <div className="flex flex-col items-end self-end ml-auto max-w-[85%]">
                  <span className="text-[9px] font-mono text-[#737373] uppercase mb-1">
                    Customer
                  </span>
                  <div
                    className="p-3 text-white rounded-[1px] leading-relaxed"
                    style={{ backgroundColor: primaryColor }}
                  >
                    What is your return policy and processing window?
                  </div>
                </div>

                {/* Simulated Bot Response */}
                <div className="flex flex-col items-start max-w-[85%]">
                  <span className="text-[9px] font-mono text-[#737373] uppercase mb-1">
                    {name}
                  </span>
                  <div className="p-3 bg-white border border-[#E5E5E5] text-[#0A0A0A] rounded-[1px] leading-relaxed">
                    According to our policy documents, returns are accepted within 30 days of purchase in original packaging.
                  </div>
                </div>
              </div>

              {/* Simulated Input Bar */}
              <div className="p-2.5 bg-white border-t border-[#E5E5E5] flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  disabled
                  placeholder="Type a message..."
                  className="flex-1 px-2.5 py-1.5 text-xs bg-[#FAFAFA] border border-[#E5E5E5] text-[#737373] rounded-[1px]"
                />
                <button
                  type="button"
                  disabled
                  className="p-1.5 text-white rounded-[1px] opacity-80"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Shareable Public Link Card ── */}
          <div className="bg-white border border-[#E5E5E5] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-[#0A0A0A]" />
              <p className="text-xs font-semibold text-[#0A0A0A] uppercase tracking-[0.05em]">
                Public Chat Link
              </p>
            </div>

            {publicChatUrl ? (
              <>
                <p className="text-[11px] text-[#737373] leading-relaxed">
                  Share this link with your customers. Anyone with the link can
                  chat with your AI assistant and raise a support ticket — no
                  login required.
                </p>

                <div className="flex items-stretch gap-2">
                  <code className="flex-1 px-3 py-2 text-[11px] font-mono bg-[#FAFAFA] border border-[#E5E5E5] text-[#0A0A0A] rounded-[1px] break-all select-all">
                    {publicChatUrl}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    title="Copy link"
                    className="px-3 py-2 border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-[#0A0A0A] transition-colors rounded-[1px] flex items-center gap-1.5 text-xs font-medium shrink-0"
                  >
                    {linkCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span className="text-[#16A34A]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <a
                  href={publicChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#737373] hover:text-[#0A0A0A] transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open in new tab to test
                </a>
              </>
            ) : (
              <p className="text-[11px] text-[#737373]">
                Save your chatbot configuration first to generate the public link.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
