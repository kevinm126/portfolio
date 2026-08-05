import type { Metadata } from "next";
import { ProfileShell } from "@/components/github/ProfileShell";
import { ResearchList } from "@/components/github/ResearchList";

export const metadata: Metadata = {
  title: "Research",
  description: "Research papers Kevin Marin suggests, with links.",
};

export default function ResearchPage() {
  return (
    <ProfileShell activeTab="research">
      <ResearchList />
    </ProfileShell>
  );
}
