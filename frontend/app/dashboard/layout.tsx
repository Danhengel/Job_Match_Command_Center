import type { ReactNode } from "react";
import { DailyBriefCard } from "@/components/dashboard/DailyBriefCard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <><DailyBriefCard />{children}</>;
}
