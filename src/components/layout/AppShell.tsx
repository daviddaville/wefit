'use client'

import BottomNav from './BottomNav'
import TopBar from './TopBar'

interface Props {
  title: string
  children: React.ReactNode
}

export default function AppShell({ title, children }: Props) {
  return (
    <>
      <TopBar title={title} />
      <main className="max-w-lg mx-auto px-4 pt-4 pb-20">{children}</main>
      <BottomNav />
    </>
  )
}
