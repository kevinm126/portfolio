"use client";

import { useState } from "react";
import { Send, Check } from "lucide-react";
import { profile, socials } from "@/content/content";
import { SocialIcon } from "@/components/ui/icons";

type State = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [state, setState] = useState<State>("idle");
  const linkSocials = socials;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("bad status");
      setState("sent");
      form.reset();
    } catch {
      setState("error");
    }
  }

  const field =
    "w-full rounded-md border border-[var(--border-input)] bg-input px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-link";

  return (
    <section className="gh-card">
      <div className="mb-4 flex items-center gap-2 border-b border-border pb-3 font-mono text-sm text-icon">
        {profile.handle}/Contact.js
      </div>

      <p className="text-sm text-muted">
        I&apos;m looking for entry-level Data Science and Software Engineering roles. Drop me a
        line.
      </p>

      {state === "sent" ? (
        <div role="status" className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green/15 text-green">
            <Check />
          </span>
          <p className="font-semibold text-fg">Thanks — your message is on its way.</p>
          <p className="text-sm text-muted">I&apos;ll get back to you soon.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-fg">
                Name <span aria-hidden="true" className="text-[#f85149]">*</span>
              </span>
              <input name="name" required placeholder="Your name" className={field} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-fg">
                Email <span aria-hidden="true" className="text-[#f85149]">*</span>
              </span>
              <input name="email" type="email" required placeholder="you@email.com" className={field} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-fg">
              Message <span aria-hidden="true" className="text-[#f85149]">*</span>
            </span>
            <textarea name="message" required rows={6} placeholder="Your message…" className={field} />
          </label>
          <button
            type="submit"
            disabled={state === "sending"}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-green px-6 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {state === "sending" ? "Sending…" : "Send Message"}
            <Send size={15} />
          </button>
          {state === "error" && (
            <p role="alert" className="text-sm text-muted">
              Something went wrong. Email me directly at{" "}
              <a href={`mailto:${profile.email}`} className="text-link hover:underline">
                {profile.email}
              </a>
              .
            </p>
          )}
        </form>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-sm text-muted">
        <span>Alternatively, find me on:</span>
        {linkSocials.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target={s.href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-link"
          >
            <SocialIcon name={s.icon} size={14} className="text-icon" />
            {s.label}
          </a>
        ))}
      </div>
    </section>
  );
}
