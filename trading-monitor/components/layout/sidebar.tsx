'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  DashboardSquare01Icon,
  Calendar03Icon,
  ChartLineData02Icon,
  Settings02Icon,
} from '@hugeicons/core-free-icons';

const navItems = [
  { href: '/', label: '대시보드', icon: DashboardSquare01Icon },
  { href: '/calendar', label: '달력', icon: Calendar03Icon },
  { href: '/portfolio', label: '포트폴리오', icon: ChartLineData02Icon },
  { href: '/settings', label: '설정', icon: Settings02Icon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <span className="text-xs font-bold text-primary-foreground">T</span>
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground">Trading Monitor</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <HugeiconsIcon
                icon={item.icon}
                className="h-4 w-4"
                strokeWidth={2}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-md px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Paper Trading</span>
        </div>
      </div>
    </aside>
  );
}
