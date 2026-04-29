import type { ReactNode } from "react";
import { useConfigStore } from "@/stores/config-store";
import { Titlebar } from "@/components/titlebar/Titlebar";
import { SidebarLayout } from "./SidebarLayout";
import { HeaderLayout } from "./HeaderLayout";
import { SidebarHeaderLayout } from "./SidebarHeaderLayout";
import { FullScreenLayout } from "./FullScreenLayout";
import type { LayoutType } from "@/lib/types";

export interface LayoutSlots {
  sidebar?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
}

const layoutMap: Record<
  LayoutType,
  React.ComponentType<LayoutSlots>
> = {
  sidebar: SidebarLayout,
  header: HeaderLayout,
  "sidebar-header": SidebarHeaderLayout,
  fullscreen: FullScreenLayout,
};

export function LayoutProvider({ sidebar, header, children }: LayoutSlots) {
  const layout = useConfigStore((s) => s.config.layout);
  const Layout = layoutMap[layout] ?? SidebarLayout;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <Titlebar />
      <Layout sidebar={sidebar} header={header}>
        {children}
      </Layout>
    </div>
  );
}
