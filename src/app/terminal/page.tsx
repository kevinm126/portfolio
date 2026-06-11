import type { Metadata } from "next";
import { Terminal } from "@/components/features/terminal";

export const metadata: Metadata = {
  title: "Terminal",
  description: "Interactive terminal version of the portfolio.",
};

export default function TerminalPage() {
  return <Terminal />;
}
