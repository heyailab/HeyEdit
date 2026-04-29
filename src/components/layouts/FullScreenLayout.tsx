import type { LayoutSlots } from "./LayoutProvider";

export function FullScreenLayout({ children }: LayoutSlots) {
  return (
    <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
  );
}
