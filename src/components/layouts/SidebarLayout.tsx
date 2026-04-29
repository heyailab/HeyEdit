import type { LayoutSlots } from "./LayoutProvider";

export function SidebarLayout({ sidebar, children }: LayoutSlots) {
  return (
    <div className="flex flex-1 overflow-hidden">
      {sidebar && (
        <aside className="flex w-56 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground select-none">
          {sidebar}
        </aside>
      )}
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
