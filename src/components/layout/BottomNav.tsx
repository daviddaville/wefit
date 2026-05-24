'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, BarChart2, UserCircle, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Accueil',   Icon: Home },
  { href: '/program',   label: 'Programme', Icon: ClipboardList },
  { href: '/exercises', label: 'Exercices', Icon: BookOpen },
  { href: '/history',   label: 'Historique',Icon: BarChart2 },
  { href: '/profile',   label: 'Vous',      Icon: UserCircle },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
