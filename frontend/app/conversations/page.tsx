import { AppShell } from "../../components/layout/AppShell";
import { ConversationsHistoryView } from "../../components/conversations/ConversationsHistoryView";

export default function ConversationsPage() {
  return (
    <AppShell>
      <ConversationsHistoryView />
    </AppShell>
  );
}

