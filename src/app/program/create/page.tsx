import AppShell from '@/components/layout/AppShell'
import CreateProgramPage from '@/features/program/CreateProgramPage'

export default function Page() {
  return (
    <AppShell title="Nouveau programme">
      <CreateProgramPage />
    </AppShell>
  )
}
