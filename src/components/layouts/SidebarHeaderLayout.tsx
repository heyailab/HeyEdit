import type { LayoutSlots } from "./LayoutProvider";

export function SidebarHeaderLayout({ sidebar, header, children }: LayoutSlots) {
  return (
    <div className="flex flex-1 overflow-hidden">
      {sidebar && (
        <aside className="flex w-56 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground select-none">
          {sidebar}
        </aside>
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        {header && (
          <header className="flex h-12 shrink-0 items-center border-b bg-sidebar px-4 text-sidebar-foreground select-none">
            {header}
          </header>
        )}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
