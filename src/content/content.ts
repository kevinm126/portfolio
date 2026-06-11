/**
 * ───────────────────────────────────────────────────────────────────────────
 *  SINGLE SOURCE OF TRUTH FOR ALL PORTFOLIO CONTENT
 * ───────────────────────────────────────────────────────────────────────────
 *  Everything the site renders (hero, about, skills, projects, experience,
 *  socials, the AI chatbot's knowledge, the terminal commands) reads from this
 *  file. Edit here and the whole site updates.
 *
 *  Content is real, pulled from Kevin's GitHub profile materials. A couple of
 *  spots are marked `CONFIRM:` — verify them when you get a sec.
 * ───────────────────────────────────────────────────────────────────────────
 */

export type Social = {
  label: string;
  href: string;
  icon: "github" | "linkedin" | "mail" | "twitter" | "fileText" | "globe" | "kaggle";
};

export type Skill = { name: string; level?: number /* 0-100, optional */ };
export type SkillGroup = { category: string; items: Skill[] };

export type Certification = {
  name: string;
  issuer: string;
  year: string;
  href?: string;
};

export type ExperienceItem = {
  role: string;
  org: string;
  start: string;
  end: string; // "Present" allowed
  location?: string;
  summary: string;
  highlights: string[];
  tech?: string[];
};

export type Project = {
  slug: string;
  title: string;
  blurb: string; // one-liner for the card
  description: string; // longer, for the case-study page
  tags: string[];
  demoUrl?: string;
  repoUrl?: string;
  liveUrl?: string;
  metrics?: { label: string; value: string }[];
  featured?: boolean;
  caseStudy?: {
    problem: string;
    approach: string[];
    result: string;
    stack: string[];
  };
};

export type EducationItem = {
  school: string;
  credential: string;
  start: string;
  end: string;
  details?: string[];
};

// ─── PROFILE ────────────────────────────────────────────────────────────────

export const profile = {
  name: "Kevin Marin",
  initials: "KM",
  handle: "kevinm126",
  homePath: "/home/kevinm126",
  identities: [
    {
      key: "data",
      label: "Data Scientist",
      blurb:
        "I build AI/ML tools end-to-end in Python — NHANES-trained risk models, multi-provider LLMs, privacy-first by design.",
    },
    {
      key: "swe",
      label: "Software Engineer",
      blurb:
        "I ship real products, from the data pipeline to the deployed app — internal tooling, web apps, tested and reviewed.",
    },
  ],
  tagline:
    "Entry-level Data Scientist & Software Engineer. I build AI/ML tools end-to-end in Python and ship real products, from NHANES-trained risk models to deployed web apps.",
  location: "Open to relocation · Remote (US)",
  email: "kmarin1220@gmail.com",
  resumeUrl: "/resume.pdf",
  // Add a square headshot at public/avatar.jpg to replace the monogram (optional).
  avatar: "/avatar.svg",
  githubUsername: "kevinm126",
  wakatimeUsername: "", // optional — add to light up the WakaTime widget with real data
  about: [
    "Hey, I'm Kevin — a Data Science student at Claremont McKenna College (Class of 2026). I like the whole arc of a problem: turning a vague question into a clean dataset, a model, and something a person can actually use.",
    "My flagship project, MetricPath, is an AI health CLI that runs a logistic mortality-risk model trained on NHANES data behind a conversational LLM intake — and it runs fully local for privacy. I also ship web apps and internal engineering tooling, and I'm currently sharpening my SQL and ML system design while prepping for interviews.",
  ],
} as const;

export const socials: Social[] = [
  { label: "GitHub", href: "https://github.com/kevinm126", icon: "github" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/kevin-marin-aa85151b1/", icon: "linkedin" },
  { label: "Email", href: "mailto:kmarin1220@gmail.com", icon: "mail" },
  { label: "Résumé", href: "/resume.pdf", icon: "fileText" },
];

// ─── SKILLS ───────────────────────────────────────────────────────────────────

export const skillGroups: SkillGroup[] = [
  {
    category: "Languages",
    items: [
      { name: "Python", level: 95 },
      { name: "SQL", level: 82 },
      { name: "TypeScript", level: 75 },
      { name: "JavaScript", level: 75 },
      { name: "HTML / CSS", level: 80 },
    ],
  },
  {
    category: "Data / ML",
    items: [
      { name: "pandas", level: 90 },
      { name: "NumPy", level: 88 },
      { name: "scikit-learn", level: 85 },
      { name: "Matplotlib", level: 80 },
      { name: "Jupyter", level: 90 },
      { name: "Logistic Regression / stats", level: 82 },
    ],
  },
  {
    category: "AI / LLM",
    items: [
      { name: "Anthropic API", level: 88 },
      { name: "OpenAI API", level: 82 },
      { name: "Ollama (local LLMs)", level: 80 },
      { name: "Prompt Engineering", level: 85 },
      { name: "MCP", level: 70 },
    ],
  },
  {
    category: "Engineering",
    items: [
      { name: "Next.js / React", level: 75 },
      { name: "Flask", level: 78 },
      { name: "Docker", level: 70 },
      { name: "PostgreSQL", level: 80 },
      { name: "Playwright", level: 70 },
      { name: "Git", level: 88 },
    ],
  },
];

export const certifications: Certification[] = [
  { name: "B.A. Data Science", issuer: "Claremont McKenna College", year: "2026" },
  { name: "CSCI143 · Big Data (data engineering at scale)", issuer: "CMC", year: "2025" },
  { name: "CSCI145 · Data Mining", issuer: "CMC", year: "2024" },
];

// ─── EXPERIENCE ───────────────────────────────────────────────────────────────

export const experience: ExperienceItem[] = [
  {
    // CONFIRM: exact title and dates at Nocturne
    role: "Software Engineer",
    org: "Nocturne Technologies",
    start: "2025",
    end: "Present",
    location: "Remote",
    summary:
      "Build internal engineering tooling for Nocturne, a Stripe-Connect SaaS for nightlife venues (nocturne.vip).",
    highlights: [
      'Designed and built "nightbored" — a self-hosted kanban + MCP server + Playwright QA harness powering an audit-driven, agent-assisted development workflow.',
      "Ship features through reviewed pull requests against the production app.",
      "Work across the stack: TypeScript, Bun, SQLite, and Playwright automation.",
    ],
    tech: ["TypeScript", "Bun", "SQLite", "Playwright", "MCP"],
  },
];

export const education: EducationItem[] = [
  {
    school: "Claremont McKenna College",
    credential: "B.A. Data Science · Class of 2026",
    start: "2022",
    end: "2026",
    details: [
      "Big Data / data engineering at scale on PostgreSQL — indexing, parallel bulk loads, full-text search over large Twitter datasets incl. a COVID-tweet analysis (CSCI143).",
      "Data Mining (CSCI145). Currently exploring Tableau / Power BI for BI reporting.",
    ],
  },
];

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

export const projects: Project[] = [
  {
    slug: "metricpath",
    title: "MetricPath",
    blurb:
      "An AI health CLI: a conversational LLM intake feeds a logistic mortality-risk model trained on public NHANES data, then writes a lifestyle report and daily schedule — privacy-first, runs fully local.",
    description:
      "A staged, mostly-pure-Python pipeline. A 19-question conversational LLM intake feeds a logistic mortality-risk model trained on NHANES public-use linked-mortality data (risk score + population percentile), then generates a Lifestyle Report and a personalized daily schedule. Multi-provider LLM (cloud or fully-local Ollama), privacy-first — no accounts, nothing retained between runs.",
    tags: ["Python", "LLMs (Anthropic / OpenAI / Ollama)", "Logistic Regression", "NHANES", "CLI"],
    repoUrl: "https://github.com/kevinm126/metricpath",
    featured: true,
    metrics: [
      { value: "NHANES", label: "trained risk model" },
      { value: "3", label: "LLM providers" },
      { value: "100%", label: "local-capable" },
    ],
    caseStudy: {
      problem:
        'Most "health insight" tools are either a wall of forms nobody finishes, or a black box that ships your data to a server. I wanted the opposite: a short, human conversation that produces a grounded, defensible picture of someone\'s lifestyle — and never leaves their machine unless they say so.',
      approach: [
        "Conversational intake: a multi-turn LLM dialogue collects 19 lifestyle data points, validating each answer in place instead of dumping a 19-field form on the user.",
        "Multi-provider LLM client: one abstraction over Anthropic, OpenAI, and local Ollama, with model-family-specific prompts. Pick a cloud key or run free, fully offline.",
        "Derived metrics: pure-Python scoring for sleep debt, activity, and diet.",
        "Risk model: a logistic-regression mortality-risk model trained on NHANES public-use linked-mortality data, producing a risk score and population percentile. Ships as JSON coefficients — inference is one dot product, a sigmoid, and a percentile lookup, with no runtime ML dependency.",
        "Report & schedule: the score feeds a structured Lifestyle Report and a personalized daily time-block schedule.",
      ],
      result:
        "A working CLI that turns a short conversation into a population-relative risk percentile, a Lifestyle Report, and a daily schedule. Privacy-first by construction (no accounts, nothing retained), runs fully local on Ollama with no API key, and is covered by an automated test suite and a safety layer.",
      stack: ["Python", "Anthropic / OpenAI / Ollama", "Logistic Regression", "NHANES", "CLI"],
    },
  },
  {
    slug: "pagerank",
    title: "PageRank Search Engine",
    blurb:
      "PageRank from scratch (power iteration) over a real web-link graph, ranking pages by query relevance against the Lawfare national-security corpus.",
    description:
      "A working search engine built around a from-scratch PageRank implementation, run on a real corpus to rank pages by both link authority and query relevance.",
    tags: ["Python", "NumPy", "Linear Algebra", "Information Retrieval"],
    repoUrl: "https://github.com/kevinm126/Pagerank_project",
    featured: true,
    metrics: [
      { value: "8★", label: "on GitHub" },
      { value: "from scratch", label: "power iteration" },
    ],
    caseStudy: {
      problem:
        "Search engines rank pages by relevance and authority. I wanted to implement the authority half — PageRank — from scratch, and run it on a real web-link graph rather than a toy example.",
      approach: [
        "Built the web-link graph from the Lawfare national-security blog corpus.",
        "Implemented PageRank via power iteration in NumPy — the linear algebra is mine, not a library's.",
        "Combined link-authority scores with query relevance to rank results.",
      ],
      result:
        "A working search engine that ranks real pages by query relevance. 8 stars on GitHub.",
      stack: ["Python", "NumPy", "Linear Algebra", "Information Retrieval"],
    },
  },
  {
    slug: "13th-care",
    title: "13th Care",
    blurb:
      "An athlete-first presentation site for a sports-care startup — responsive, scroll-reveal animations, deployed on Vercel with security headers. Shipped freelance.",
    description:
      "A multi-page, athlete-first marketing site for a sports-care startup: responsive layout, scroll-reveal animations, deployed on Vercel with security headers.",
    tags: ["HTML", "CSS", "JavaScript", "Vercel"],
    liveUrl: "https://13th-care-site.vercel.app",
    featured: true,
    metrics: [
      { value: "live", label: "shipped freelance" },
      { value: "Vercel", label: "+ security headers" },
    ],
    caseStudy: {
      problem:
        "A sports-care startup needed a credible, athlete-first web presence that loaded fast and looked sharp on mobile.",
      approach: [
        "Designed a multi-page, responsive layout built around athletes.",
        "Added scroll-reveal animations for polish without bloat.",
        "Deployed on Vercel with security headers.",
      ],
      result: "A shipped, live marketing site for a real freelance client.",
      stack: ["HTML", "CSS", "JavaScript", "Vercel"],
    },
  },
  {
    slug: "redditbot",
    title: "redditbot",
    blurb:
      "A sentiment-driven Reddit bot (PRAW + TextBlob) that classified and acted on ~1,000 comments by polarity.",
    description:
      "A Python bot that streams Reddit comments, scores their sentiment with TextBlob, and acts on them by polarity.",
    tags: ["Python", "PRAW", "TextBlob", "NLP"],
    repoUrl: "https://github.com/kevinm126/redditbot",
    metrics: [{ value: "~1,000", label: "comments classified" }],
  },
  {
    slug: "flask-on-docker",
    title: "Flask on Docker",
    blurb:
      "A containerized Flask web app with Docker + CI — the full deployment path, end to end.",
    description:
      "A containerized Flask application with Docker and CI, built as deployment practice for shipping Python web apps.",
    tags: ["Python", "Flask", "Docker", "CI"],
    repoUrl: "https://github.com/kevinm126/flask-on-docker",
  },
  {
    slug: "this-portfolio",
    title: "This Portfolio",
    blurb:
      "The site you're on: a Next.js 16 clone of a GitHub profile — interactive chess, a contribution graph you can type into, a Copilot-style chatbot, a ⌘K command palette, light/dark themes, and a community correspondence chess board.",
    description:
      "A from-scratch portfolio built as a faithful clone of a GitHub profile page: a click-to-move chess engine (chess.js), a contribution graph you can render words into, an AI 'ask my résumé' chatbot, a ⌘K command palette, a research-review section, light/dark theming, and a shared community chess board. Built to be a project, not just a showcase.",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "chess.js"],
    repoUrl: "https://github.com/kevinm126/portfolio",
    // liveUrl set after the first Vercel deploy
    metrics: [{ value: "20+", label: "features" }],
  },
];

// ─── RESEARCH REVIEWS ─────────────────────────────────────────────────────────
//  Papers I've read, with my own notes. Seeded from the domains my projects and
//  coursework actually touch — curate / add to these as I read more.

export type ResearchPaper = {
  slug: string;
  title: string;
  authors: string;
  venue: string;
  year: string;
  url: string;
  tags: string[];
  rating: 1 | 2 | 3 | 4 | 5; // how strongly I'd recommend it
  relatedProject?: string; // a project slug this connects to
  takeaway: string; // one-line "why it stuck with me"
  review: string; // my longer note
};

export const papers: ResearchPaper[] = [
  {
    slug: "pagerank-1999",
    title: "The PageRank Citation Ranking: Bringing Order to the Web",
    authors: "Page, Brin, Motwani & Winograd",
    venue: "Stanford InfoLab",
    year: "1999",
    url: "http://ilpubs.stanford.edu:8090/422/",
    tags: ["Information Retrieval", "Graphs", "Linear Algebra"],
    rating: 5,
    relatedProject: "pagerank",
    takeaway:
      "Authority is just the dominant eigenvector of the web's link graph — a whole search engine falls out of one fixed-point iteration.",
    review:
      "This is the paper I reimplemented from scratch for my PageRank project. Reading it before coding it made the difference: the 'random surfer' framing turns an intimidating eigenvector problem into a damped power iteration you can write in a dozen lines of NumPy. It's also a clinic in choosing the right abstraction — they model the entire web as a stochastic matrix and let linear algebra do the work.",
  },
  {
    slug: "attention-2017",
    title: "Attention Is All You Need",
    authors: "Vaswani et al.",
    venue: "NeurIPS",
    year: "2017",
    url: "https://arxiv.org/abs/1706.03762",
    tags: ["Transformers", "NLP", "Deep Learning"],
    rating: 5,
    relatedProject: "metricpath",
    takeaway:
      "Drop recurrence, keep attention — the architecture every LLM I build against is descended from this.",
    review:
      "Required reading for anyone touching LLMs. I work against the Anthropic, OpenAI and Ollama APIs in MetricPath, and understanding self-attention — why these models are good at the long, multi-turn intake conversation it relies on — comes straight from here. The 'attention is a soft, content-addressable lookup' mental model is the one I keep coming back to.",
  },
  {
    slug: "domingos-2012",
    title: "A Few Useful Things to Know About Machine Learning",
    authors: "Pedro Domingos",
    venue: "Communications of the ACM",
    year: "2012",
    url: "https://homes.cs.washington.edu/~pedrod/papers/cacm12.pdf",
    tags: ["Machine Learning", "Practical", "Generalization"],
    rating: 5,
    takeaway:
      "Data beats a cleverer algorithm, and the thing you're really fighting is overfitting — judgment, not math.",
    review:
      "The most quotable ML paper I've read, and the one I'd hand to anyone starting out. 'It's generalization that counts', 'more data beats a cleverer algorithm', 'feature engineering is the key' — these aren't equations, they're the instincts that kept my NHANES mortality-risk model honest. I re-read it whenever I'm tempted to reach for a fancier model instead of better features.",
  },
  {
    slug: "lasso-1996",
    title: "Regression Shrinkage and Selection via the Lasso",
    authors: "Robert Tibshirani",
    venue: "J. Royal Statistical Society B",
    year: "1996",
    url: "https://www.jstor.org/stable/2346178",
    tags: ["Statistics", "Regularization", "Feature Selection"],
    rating: 4,
    relatedProject: "metricpath",
    takeaway:
      "An L1 penalty does selection and fitting in one shot — sparse models you can actually explain.",
    review:
      "Directly relevant to the logistic model behind MetricPath. The lasso's geometric intuition — why an L1 ball drives coefficients exactly to zero where an L2 ball only shrinks them — is what made regularization click for me. For a health model that has to be interpretable, a sparse, defensible set of coefficients matters as much as the score itself.",
  },
  {
    slug: "mapreduce-2004",
    title: "MapReduce: Simplified Data Processing on Large Clusters",
    authors: "Jeffrey Dean & Sanjay Ghemawat",
    venue: "OSDI",
    year: "2004",
    url: "https://research.google/pubs/pub62/",
    tags: ["Distributed Systems", "Big Data", "Systems"],
    rating: 4,
    takeaway:
      "Two functions — map and reduce — and a runtime that hides the hard parts of running them on a thousand machines.",
    review:
      "I read this around my Big Data coursework (CSCI143), where I was doing parallel bulk loads and full-text search over large Twitter datasets in PostgreSQL. MapReduce is the cleanest example I know of moving complexity out of the user's code and into the framework — fault tolerance, data locality and parallelism become someone else's problem. It reframed how I think about scaling a data pipeline.",
  },
];

// ─── NAV (single-page section anchors) ────────────────────────────────────────

export const navSections = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "guestbook", label: "Guestbook" },
  { id: "contact", label: "Contact" },
] as const;
