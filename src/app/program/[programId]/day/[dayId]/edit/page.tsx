import AppShell from '@/components/layout/AppShell'
import EditDayPage from '@/features/program/EditDayPage'

export default async function Page(props: PageProps<'/program/[programId]/day/[dayId]/edit'>) {
  const { programId, dayId } = await props.params

  return (
    <AppShell title="Modifier la séance">
      <EditDayPage dayId={dayId} programId={programId} />
    </AppShell>
  )
}
