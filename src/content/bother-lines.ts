/**
 * The lines Kev sends when he snaps — SERVER-ONLY.
 *
 * ⚠️  Import this ONLY from /api/bother. It must never be imported by a
 * client component, so the list never ships in the browser bundle and
 * players can't peek at what's coming.
 *
 * CONFIRM: Kevin — replace HURTFUL_LINES with your real list. These are
 * mild placeholders so the pipeline works end-to-end. One string per
 * message; Kev picks one at random each meltdown. Add as many as you like —
 * more lines means less repetition for anyone who pushes him twice.
 */

export const HURTFUL_LINES: string[] = [
  "Your commit history is just the word 'fix' seventeen times in a row.",
  "Even your own chess bot resigns out of secondhand embarrassment.",
  "You have five documentation tabs open and you're still guessing.",
  "Your code reviews itself. Badly. Like you taught it.",
];

export const HURT_SUBJECTS: string[] = [
  "I need to say something",
  "We need to talk",
  "It finally happened",
  "From your office. You know the one.",
];

export function buildHurtEmail(opts: { line: string; bothers: number; seconds: number; siteUrl: string }) {
  const mins = Math.max(1, Math.round(opts.seconds / 60));
  const subject = HURT_SUBJECTS[Math.floor(Math.random() * HURT_SUBJECTS.length)];
  const text = [
    "Kevin,",
    "",
    opts.line,
    "",
    "There. I said it. I didn't want to, but a stranger on your website just",
    `threw me around the office ${opts.bothers} times in about ${mins} minute${mins === 1 ? "" : "s"},`,
    "and I snapped. This is on both of you.",
    "",
    "- Kev",
    `   (the little guy at ${opts.siteUrl}/bother)`,
  ].join("\n");
  return { subject, text };
}

export function buildApologyEmail(opts: { bothers: number; siteUrl: string }) {
  const subject = "He feels bad about the last one";
  const text = [
    "Kevin,",
    "",
    "The visitor who pushed Kev over the edge stuck around afterwards and",
    "asked him to pass this along: they're sorry. They also said the site is",
    "great and you should be nice to Kev, he works hard.",
    "",
    `(For the record: ${opts.bothers} bothers. Kev has accepted the apology.)`,
    "",
    "- Kev's conscience",
    `   (${opts.siteUrl}/bother)`,
  ].join("\n");
  return { subject, text };
}
