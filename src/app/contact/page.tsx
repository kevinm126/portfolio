import type { Metadata } from "next";
import { ProfileShell } from "@/components/github/ProfileShell";
import { ContactForm } from "@/components/github/ContactForm";

export const metadata: Metadata = {
  title: "Get in Touch",
  description: "Contact Kevin Marin.",
};

export default function ContactPage() {
  return (
    <ProfileShell activeTab="contact">
      <h1 className="mb-4 text-xl font-semibold text-fg">Get in Touch</h1>
      <ContactForm />
    </ProfileShell>
  );
}
