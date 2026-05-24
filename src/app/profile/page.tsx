import AppShell from '@/components/layout/AppShell'
import ProfilePage from '@/features/profile/ProfilePage'

export default function Page() {
  return (
    <AppShell title="Vous">
      <ProfilePage />
    </AppShell>
  )
}
