import { AppShell } from "../../components/layout/AppShell";
import { TicketsInboxView } from "../../components/tickets/TicketsInboxView";

export default function TicketsPage() {
  return (
    <AppShell>
      <TicketsInboxView />
    </AppShell>
  );
}
