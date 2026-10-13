import { AppShell } from "../../components/layout/AppShell";
import { DashboardOverview } from "../../components/dashboard/DashboardOverview";

export const metadata = {
  title: "Dashboard — Converso",
  description: "Monitor your AI chatbot, knowledge base, and support tickets.",
};

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardOverview />
    </AppShell>
  );
}

