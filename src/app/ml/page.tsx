import type { Metadata } from "next";
import { TopHeader } from "@/components/github/TopHeader";
import { SiteFooter } from "@/components/github/SiteFooter";
import { DoodleGame } from "@/components/ml/DoodleGame";
import { DigitLab } from "@/components/ml/DigitLab";
import { ModelCards } from "@/components/ml/ModelCards";

export const metadata: Metadata = {
  title: "ML Lab",
  description:
    "Draw against two CNNs I trained myself: a Pictionary-style doodle duel over 40 objects and a classic digit recognizer with a live saliency explainer. Everything runs in your browser via ONNX.",
};

export default function MLLabPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopHeader activeTab="ml" />
      <main className="mx-auto w-full max-w-[1216px] flex-1 px-4 py-6 sm:px-8">
        <h1 className="mb-3 text-xl font-semibold text-fg">ML Lab</h1>
        <p className="mb-8 max-w-2xl text-sm text-muted">
          Two convolutional networks, trained by me, running entirely in your browser: no server,
          no API, just ONNX and WebAssembly. Play Pictionary against the doodle model, then scroll
          down to see exactly how the digit model reads your handwriting, and peek at how both
          were built.
        </p>
        <DoodleGame />
        <DigitLab />
        <ModelCards />
      </main>
      <SiteFooter />
    </div>
  );
}
