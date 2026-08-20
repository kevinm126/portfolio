import { projects, skillGroups, type Project } from "@/content/content";

/** GitHub-ish language dot colors. */
export const LANGUAGE_COLORS: Record<string, string> = {
  Python: "#3776ab",
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SQL: "#e38c00",
  Jupyter: "#da5b0b",
  Java: "#b07219",
  Shell: "#89e051",
};

const SLUG_LANGUAGE: Record<string, string> = {
  metricpath: "Python",
  pagerank: "Python",
  "13th-care": "JavaScript",
  redditbot: "Python",
  "flask-on-docker": "Python",
  "this-portfolio": "TypeScript",
  "sketch-lab": "Python",
};

/** Pinned = the strongest, in display order. */
const PINNED = ["sketch-lab", "metricpath", "pagerank", "13th-care", "redditbot", "flask-on-docker"];

export type Repo = {
  slug: string;
  name: string; // github-style repo name
  title: string; // display title
  href: string;
  description: string;
  language: string;
  languageColor: string;
  demoUrl?: string;
  codeUrl?: string;
  tags: string[];
  metrics?: { label: string; value: string }[];
};

function repoName(p: Project) {
  return p.repoUrl?.split("/").pop() ?? p.slug;
}

export function toRepo(p: Project): Repo {
  const language = SLUG_LANGUAGE[p.slug] ?? "TypeScript";
  return {
    slug: p.slug,
    name: repoName(p),
    title: p.title,
    href: `/projects/${p.slug}`,
    description: p.blurb,
    language,
    languageColor: LANGUAGE_COLORS[language] ?? "#f78166",
    demoUrl: p.liveUrl ?? p.demoUrl,
    codeUrl: p.repoUrl,
    tags: p.tags,
    metrics: p.metrics,
  };
}

export const allRepos: Repo[] = projects.map(toRepo);

export const pinnedRepos: Repo[] = PINNED.map((s) =>
  allRepos.find((r) => r.slug === s)
).filter((r): r is Repo => Boolean(r));

export function repoBySlug(slug: string): Repo | undefined {
  return allRepos.find((r) => r.slug === slug);
}

/** Tech badges for the README card, with brand-ish colors. */
export type TechBadge = { label: string; color: string };

const TECH_COLORS: Record<string, string> = {
  Python: "#3776ab",
  SQL: "#e38c00",
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  "HTML / CSS": "#e34c26",
  pandas: "#150458",
  NumPy: "#4dabcf",
  "scikit-learn": "#f7931e",
  Matplotlib: "#11557c",
  Jupyter: "#da5b0b",
  "Logistic Regression / stats": "#26a641",
  "Anthropic API": "#d97757",
  "OpenAI API": "#74aa9c",
  "Ollama (local LLMs)": "#0b8c8c",
  "Prompt Engineering": "#8957e5",
  MCP: "#4493f8",
  "Next.js / React": "#61dafb",
  Flask: "#3b7dd8",
  Docker: "#2496ed",
  PostgreSQL: "#4169e1",
  Playwright: "#2ead33",
  Git: "#f05032",
};

export const techBadges: TechBadge[] = (() => {
  const seen = new Set<string>();
  const out: TechBadge[] = [];
  for (const g of skillGroups) {
    for (const s of g.items) {
      if (seen.has(s.name)) continue;
      seen.add(s.name);
      out.push({ label: s.name, color: TECH_COLORS[s.name] ?? "#4493f8" });
    }
  }
  return out;
})();
