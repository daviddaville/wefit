import AppShell from '@/components/layout/AppShell'
import ExerciseDetailPage from '@/features/exercises/ExerciseDetailPage'

interface Props {
  params: Promise<{ exerciseId: string }>
}

export default async function Page({ params }: Props) {
  const { exerciseId } = await params
  return (
    <AppShell title="">
      <ExerciseDetailPage exerciseId={exerciseId} />
    </AppShell>
  )
}
