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

export type Skill = {
  name: string;
  level?: number /* 0-100, optional */;
  /** Project slugs that prove this skill — rendered as evidence links. */
  provenBy?: string[];
};
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
  /** The recruiter fast-lane line, rendered in the site-wide banner + OG card. */
  availability: {
    status: "Seeking entry-level Data Science / Software Engineering roles",
    facts: "B.A. Data Science, Claremont McKenna '26 · Open to relocation · Remote (US)",
  },
  email: "kmarin1220@gmail.com",
  resumeUrl: "/resume.pdf",
  // Luca-style 3D headshot (optimized 768px JPEG, ~90KB). The sidebar renders
  // it animated; the header avatar menu uses it static. Fallback at /avatar.svg.
  avatar: "/avatar-3d.jpg",
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
  { label: "Résumé", href: "/resume", icon: "fileText" },
];

// ─── SKILLS ───────────────────────────────────────────────────────────────────

export const skillGroups: SkillGroup[] = [
  {
    category: "Languages",
    items: [
      { name: "Python", level: 95, provenBy: ["metricpath", "pagerank", "redditbot"] },
      { name: "SQL", level: 82 },
      { name: "TypeScript", level: 75, provenBy: ["this-portfolio"] },
      { name: "JavaScript", level: 75, provenBy: ["this-portfolio"] },
      { name: "HTML / CSS", level: 80, provenBy: ["13th-care", "this-portfolio"] },
    ],
  },
  {
    category: "Data / ML",
    items: [
      { name: "pandas", level: 90, provenBy: ["metricpath", "pagerank"] },
      { name: "NumPy", level: 88, provenBy: ["pagerank", "metricpath"] },
      { name: "scikit-learn", level: 85, provenBy: ["metricpath"] },
      { name: "Matplotlib", level: 80 },
      { name: "Jupyter", level: 90 },
      { name: "Logistic Regression / stats", level: 82, provenBy: ["metricpath"] },
    ],
  },
  {
    category: "AI / LLM",
    items: [
      { name: "Anthropic API", level: 88, provenBy: ["metricpath", "this-portfolio"] },
      { name: "OpenAI API", level: 82, provenBy: ["metricpath"] },
      { name: "Ollama (local LLMs)", level: 80, provenBy: ["metricpath"] },
      { name: "Prompt Engineering", level: 85, provenBy: ["metricpath", "this-portfolio"] },
      { name: "MCP", level: 70 },
    ],
  },
  {
    category: "Engineering",
    items: [
      { name: "Next.js / React", level: 75, provenBy: ["this-portfolio"] },
      { name: "Flask", level: 78, provenBy: ["flask-on-docker"] },
      { name: "Docker", level: 70, provenBy: ["flask-on-docker"] },
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
    metrics: [{ value: "end-to-end", label: "Dockerized deploy + CI" }],
  },
  {
    slug: "this-portfolio",
    title: "This Portfolio",
    blurb:
      "The site you're on: a Next.js 16 clone of a GitHub profile — interactive chess, a contribution graph you can type into, a Copilot-style chatbot, a ⌘K command palette, light/dark themes, a community correspondence chess board, and a Poptropica-style office game with real consequences.",
    description:
      "A from-scratch portfolio built as a faithful clone of a GitHub profile page: a click-to-move chess engine (chess.js), a contribution graph you can render words into, an AI 'ask my résumé' chatbot, a ⌘K command palette, a paper-suggestions section, light/dark theming, a shared community chess board, and 'Bother Kev' — a hand-drawn canvas office game where tormenting a tiny coworker eventually gets a real hurtful email sent to my real inbox. Built to be a project, not just a showcase.",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "chess.js"],
    repoUrl: "https://github.com/kevinm126/portfolio",
    // Self-populates once NEXT_PUBLIC_SITE_URL is set (see .env.example).
    liveUrl: process.env.NEXT_PUBLIC_SITE_URL,
    metrics: [{ value: "20+", label: "features" }],
  },
];

// ─── PAPER SUGGESTIONS ────────────────────────────────────────────────────────
//  Papers (and one essay) I suggest to anyone getting into data science.
//  Each gets a link and one line on why it's worth your time. No ratings,
//  no reviews, no em dashes. Newest addition goes on TOP: this list reads
//  most-recently-added first, so new finds land at the head of the array.

export type ResearchPaper = {
  slug: string;
  title: string;
  authors: string;
  venue: string; // essays are labeled honestly
  year: string;
  url: string;
  tags: string[];
  why: string; // one line on why you should read it
};

export const papers: ResearchPaper[] = [
  {
    slug: "llms-cant-jump-2026",
    title: "Position: LLMs can't jump",
    authors: "Tom Zahavy",
    venue: "ICML",
    year: "2026",
    url: "https://icml.cc/virtual/2026/poster/67091",
    tags: ["LLMs", "Reasoning", "Philosophy"],
    why: "The abductive leap, inventing the premises rather than deriving the proof, is the one move LLMs still can't make. Read it right after The Bitter Lesson and let the two argue.",
  },
  {
    slug: "bitter-lesson-2019",
    title: "The Bitter Lesson",
    authors: "Rich Sutton",
    venue: "essay",
    year: "2019",
    url: "http://www.incompleteideas.net/IncIdeas/BitterLesson.html",
    tags: ["AI", "Essay", "History"],
    why: "1,100 words explaining seventy years of AI research regret: general methods plus compute beat human cleverness, every time.",
  },
  {
    slug: "shannon-1948",
    title: "A Mathematical Theory of Communication",
    authors: "Claude Shannon",
    venue: "Bell System Technical Journal",
    year: "1948",
    url: "https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf",
    tags: ["Information Theory", "Foundations"],
    why: "One paper invents the bit, entropy, and the ceiling on every channel. Everything else on this list is measured in its units.",
  },
  {
    slug: "gpt3-2020",
    title: "Language Models are Few-Shot Learners",
    authors: "Brown et al.",
    venue: "NeurIPS",
    year: "2020",
    url: "https://arxiv.org/abs/2005.14165",
    tags: ["LLMs", "NLP", "Scaling"],
    why: "Scale as a research result in its own right, and the paper where the current era of AI actually begins.",
  },
  {
    slug: "alexnet-2012",
    title: "ImageNet Classification with Deep Convolutional Neural Networks",
    authors: "Krizhevsky, Sutskever & Hinton",
    venue: "NeurIPS",
    year: "2012",
    url: "https://papers.nips.cc/paper_files/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html",
    tags: ["Deep Learning", "Computer Vision"],
    why: "The starting gun for modern deep learning. Eight pages, one GPU trick, and a decade of consequences.",
  },
  {
    slug: "ioannidis-2005",
    title: "Why Most Published Research Findings Are False",
    authors: "John Ioannidis",
    venue: "PLoS Medicine",
    year: "2005",
    url: "https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.0020124",
    tags: ["Statistics", "Inference", "Science"],
    why: "The cheapest inoculation available against taking p-values at face value: uncomfortable, famous, and worth the discomfort.",
  },
  {
    slug: "tidy-data-2014",
    title: "Tidy Data",
    authors: "Hadley Wickham",
    venue: "Journal of Statistical Software",
    year: "2014",
    url: "https://www.jstatsoft.org/article/view/v059i10",
    tags: ["Data Wrangling", "Statistics", "Practice"],
    why: "The paper behind why every dataframe you've ever liked felt likeable. You already follow its rules; this is where they come from.",
  },
  {
    slug: "effectiveness-of-data-2009",
    title: "The Unreasonable Effectiveness of Data",
    authors: "Halevy, Norvig & Pereira",
    venue: "IEEE Intelligent Systems",
    year: "2009",
    url: "https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/35179.pdf",
    tags: ["Data", "Machine Learning", "NLP"],
    why: "Why more data beats a cleverer model more often than anyone's pride would like. Four pages that predicted the next fifteen years.",
  },
  {
    slug: "tech-debt-2015",
    title: "Hidden Technical Debt in Machine Learning Systems",
    authors: "Sculley et al.",
    venue: "NeurIPS",
    year: "2015",
    url: "https://papers.nips.cc/paper_files/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html",
    tags: ["ML Systems", "Production", "Engineering"],
    why: "The model is the smallest box in the diagram; everything around it is the actual job. Read before your first ML role, re-read during it.",
  },
  {
    slug: "two-cultures-2001",
    title: "Statistical Modeling: The Two Cultures",
    authors: "Leo Breiman",
    venue: "Statistical Science",
    year: "2001",
    url: "https://projecteuclid.org/journals/statistical-science/volume-16/issue-3/Statistical-Modeling--The-Two-Cultures-with-comments-and-a/10.1214/ss/1009213726.full",
    tags: ["Statistics", "Machine Learning", "Philosophy"],
    why: "The stats-versus-ML worldview split, named in 2001, and still the argument underneath every modeling debate you'll ever be in.",
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
