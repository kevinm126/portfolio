import type { Metadata } from "next";
import { ProfileShell } from "@/components/github/ProfileShell";
import { ResearchList } from "@/components/github/ResearchList";

export const metadata: Metadata = {
  title: "Research Recommendations",
  description: "Research papers Kevin Marin recommends, with links.",
};

export default function ResearchPage() {
  return (
    <ProfileShell activeTab="research">
      <ResearchList />
    </ProfileShell>
  );
}
