import AppShell from '@/components/layout/AppShell'
import DashboardPage from '@/features/dashboard/DashboardPage'

export default function Page() {
  return (
    <AppShell title="AI-RepCoach">
      <DashboardPage />
    </AppShell>
  )
}
