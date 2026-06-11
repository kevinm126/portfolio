import type { Metadata } from "next";
import { ProfileShell } from "@/components/github/ProfileShell";
import { RepoFilterList } from "@/components/github/RepoFilterList";
import { allRepos } from "@/lib/github-data";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Projects by Kevin Marin.",
};

export default function PortfolioPage() {
  return (
    <ProfileShell activeTab="portfolio">
      <RepoFilterList repos={allRepos} />
    </ProfileShell>
  );
}
