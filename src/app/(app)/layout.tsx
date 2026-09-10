import { AppChrome } from "@/components/shell/AppChrome";
import { loadChrome } from "@/lib/workspace";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const chrome = await loadChrome();
  return <AppChrome {...chrome}>{children}</AppChrome>;
}
