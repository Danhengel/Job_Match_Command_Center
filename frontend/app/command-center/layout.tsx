import type { ReactNode } from "react";
import { DailyBriefCard } from "@/components/dashboard/DailyBriefCard";

export default function CommandCenterLayout({ children }: { children: ReactNode }) {
  return <><DailyBriefCard />{children}</>;
}
