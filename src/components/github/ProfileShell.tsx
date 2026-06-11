import { TopHeader } from "./TopHeader";
import { ProfileSidebar } from "./ProfileSidebar";
import { SiteFooter } from "./SiteFooter";
import type { TabId } from "./TabNav";

export function ProfileShell({
  activeTab,
  children,
}: {
  activeTab: TabId;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopHeader activeTab={activeTab} />
      <section className="mx-auto flex w-full max-w-[1216px] flex-1 flex-col gap-[18px] md:flex-row md:gap-6 md:px-8 md:pt-8">
        <ProfileSidebar />
        <main className="min-w-0 flex-1 px-4 md:max-w-[895px] md:px-0">{children}</main>
      </section>
      <SiteFooter />
    </div>
  );
}
