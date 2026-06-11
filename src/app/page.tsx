import { ProfileShell } from "@/components/github/ProfileShell";
import { ReadmeCard } from "@/components/github/ReadmeCard";
import { ProjectTable } from "@/components/github/ProjectTable";
import { ContributionPanel } from "@/components/github/ContributionPanel";
import { allRepos } from "@/lib/github-data";

export default function Home() {
  return (
    <ProfileShell activeTab="welcome">
      <ReadmeCard />
      <ProjectTable repos={allRepos} title="Projects" className="mt-5" />
      <ContributionPanel />
    </ProfileShell>
  );
}
