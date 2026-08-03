/**
 * Plain-text knowledge base for the "Ask my résumé" chatbot and the terminal's
 * `whoami` / `ask` commands. Keep it in natural prose — it gets passed to the
 * model as grounded context. The richer and more specific this is, the better
 * the answers. Content is assembled from content.ts — edit there.
 */

import { profile, skillGroups, experience, projects, education, certifications } from "./content";

export const resumeText = `
# ${profile.name} — Résumé (knowledge base)

## Summary
${profile.tagline}
Location: ${profile.location}. Email: ${profile.email}.

## About
${profile.about.join("\n")}

## Education
${education
  .map(
    (e) =>
      `- ${e.credential}, ${e.school} (${e.start}–${e.end}). ${(e.details ?? []).join("; ")}`
  )
  .join("\n")}

## Certifications & Coursework
${certifications.map((c) => `- ${c.name} — ${c.issuer} (${c.year})`).join("\n")}

## Experience
${experience
  .map(
    (x) =>
      `### ${x.role} @ ${x.org} (${x.start}–${x.end})\n${x.summary}\n${x.highlights
        .map((h) => `- ${h}`)
        .join("\n")}\nTech: ${(x.tech ?? []).join(", ")}`
  )
  .join("\n\n")}

## Skills
${skillGroups
  .map((g) => `- ${g.category}: ${g.items.map((i) => i.name).join(", ")}`)
  .join("\n")}

## Projects
${projects
  .map(
    (p) =>
      `### ${p.title}\n${p.description}\nTags: ${p.tags.join(", ")}.${
        p.metrics ? ` Results: ${p.metrics.map((m) => `${m.label} ${m.value}`).join(", ")}.` : ""
      }`
  )
  .join("\n\n")}
`.trim();

/** A few canned Q&As used when no LLM API key is configured (demo mode). */
export const cannedAnswers: { q: RegExp; a: string }[] = [
  {
    q: /python|pandas|scikit|ml|machine learning|model/i,
    a: `Yes — Python is my strongest language. I use pandas/NumPy/scikit-learn day to day: MetricPath runs a logistic mortality-risk model I trained on NHANES data, and my Reddit bot classified ~1,000 comments by sentiment. (Demo mode: add an ANTHROPIC_API_KEY to get fully generated answers — see SETUP.md.)`,
  },
  {
    q: /experience|intern|work|job/i,
    a: `I build AI/ML tools end-to-end — from MetricPath (an AI health CLI) to a freelance client site I shipped on Vercel — and I've worked with Nocturne Technologies. The Experience section has the specifics. (Demo mode — add an API key for live answers.)`,
  },
  {
    q: /contact|email|reach|hire/i,
    a: `You can reach me at ${profile.email}, or use the Get in Touch form. (Demo mode.)`,
  },
  {
    q: /.*/,
    a: `I'm a demo version of the AI me. Add an ANTHROPIC_API_KEY (see SETUP.md) and I'll answer anything about my experience, skills, and projects from my résumé. In the meantime, try asking about my Python/ML work or how to contact me.`,
  },
];
