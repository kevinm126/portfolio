import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { CommandPalette } from "@/components/layout/command-palette";
import { CopilotChat } from "@/components/github/CopilotChat";
import { profile } from "@/content/content";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${profile.name} · ${profile.identities[0].label}`,
    template: `%s · ${profile.name}`,
  },
  description: profile.tagline,
  openGraph: { title: profile.name, description: profile.tagline, type: "website" },
  twitter: { card: "summary_large_image", title: profile.name, description: profile.tagline },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full" data-theme="dark">
      <body className="min-h-full antialiased">
        {/* Apply saved/system theme before first paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){}})();`,
          }}
        />
        <Providers>
          {children}
          <CommandPalette />
          <CopilotChat />
        </Providers>
      </body>
    </html>
  );
}
