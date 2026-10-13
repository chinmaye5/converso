import { AppShell } from "../../components/layout/AppShell";
import { WorkspaceSettingsView } from "../../components/settings/WorkspaceSettingsView";

export default function SettingsPage() {
  return (
    <AppShell>
      <WorkspaceSettingsView />
    </AppShell>
  );
}
