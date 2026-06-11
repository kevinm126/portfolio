import type { Metadata } from "next";
import { ProfileShell } from "@/components/github/ProfileShell";
import { ResearchList } from "@/components/github/ResearchList";

export const metadata: Metadata = {
  title: "Research",
  description: "Papers Kevin Marin has read, with notes and reviews.",
};

export default function ResearchPage() {
  return (
    <ProfileShell activeTab="research">
      <ResearchList />
    </ProfileShell>
  );
}
