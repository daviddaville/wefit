import AppShell from '@/components/layout/AppShell'
import SessionPage from '@/features/session/SessionPage'

export default async function Page(props: PageProps<'/session/[workoutDayId]'>) {
  const { workoutDayId } = await props.params

  return (
    <AppShell title="Séance en cours">
      <SessionPage workoutDayId={workoutDayId} />
    </AppShell>
  )
}
