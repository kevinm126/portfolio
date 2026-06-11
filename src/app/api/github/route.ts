import { profile } from "@/content/content";

export const dynamic = "force-dynamic";

type Repo = {
  name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  html_url: string;
  fork: boolean;
};

function mock() {
  return {
    demo: true,
    login: "your-github",
    followers: 142,
    publicRepos: 38,
    stars: 96,
    avatar: null as string | null,
    url: "https://github.com",
    top: [
      { name: "churn-prediction", desc: "Gradient-boosted churn model + Streamlit demo", stars: 54, lang: "Python", url: "#" },
      { name: "nyc-demand-forecast", desc: "Hourly ride-demand forecasting", stars: 23, lang: "Jupyter Notebook", url: "#" },
      { name: "ask-my-resume", desc: "RAG chatbot grounded in my résumé", stars: 12, lang: "TypeScript", url: "#" },
      { name: "portfolio", desc: "This website", stars: 7, lang: "TypeScript", url: "#" },
    ],
  };
}

export async function GET() {
  const user = profile.githubUsername;
  if (!user || user.startsWith("TODO")) {
    return Response.json(mock());
  }

  try {
    const headers: Record<string, string> = {
      "User-Agent": "portfolio",
      Accept: "application/vnd.github+json",
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const [uRes, rRes] = await Promise.all([
      fetch(`https://api.github.com/users/${user}`, { headers }),
      fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=updated`, { headers }),
    ]);

    const u = await uRes.json();
    const repos: Repo[] = await rRes.json();

    if (u?.message || !Array.isArray(repos)) {
      // rate-limited or not found — fall back gracefully
      return Response.json(mock());
    }

    const stars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
    // Surface real projects, not coursework/scratch repos, in the "top" widget.
    const isNoise = (name: string) =>
      /^(hw[-_]?\d|homework|assignment|lab[-_]?\d|tmp|temp|test|scratch|practice)/i.test(name);
    const top = repos
      .filter((r) => !r.fork && !isNoise(r.name))
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 4)
      .map((r) => ({
        name: r.name,
        desc: r.description,
        stars: r.stargazers_count,
        lang: r.language,
        url: r.html_url,
      }));

    return Response.json({
      demo: false,
      login: u.login,
      followers: u.followers,
      publicRepos: u.public_repos,
      stars,
      avatar: u.avatar_url,
      url: u.html_url,
      top,
    });
  } catch (err) {
    console.error("[github] error:", err);
    return Response.json(mock());
  }
}
