/**
 * Plain-text knowledge base for the "Ask my résumé" chatbot and the terminal's
 * `whoami` / `ask` commands. Keep it in natural prose — it gets passed to the
 * model as grounded context. The richer and more specific this is, the better
 * the answers. TODO: replace with your real résumé text.
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
    a: `Yes — Python is ${profile.name}'s strongest language, used across pandas/NumPy/scikit-learn for projects like the churn model (0.91 ROC-AUC) and the NYC demand forecast (9.4% MAPE). (Demo mode: add an ANTHROPIC_API_KEY to get fully generated answers — see SETUP.md.)`,
  },
  {
    q: /experience|intern|work|job/i,
    a: `${profile.name} has hands-on experience as a Data Science Intern and an Undergraduate Research Assistant — see the Experience section for the specifics. (Demo mode — add an API key for live answers.)`,
  },
  {
    q: /contact|email|reach|hire/i,
    a: `You can reach ${profile.name} at ${profile.email}, or use the Contact form on this page. (Demo mode.)`,
  },
  {
    q: /.*/,
    a: `I'm a demo version of ${profile.name}'s assistant. Add an ANTHROPIC_API_KEY (see SETUP.md) and I'll answer anything about his experience, skills, and projects from his résumé. In the meantime, try asking about his Python/ML work or how to contact him.`,
  },
];
