'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, LayoutDashboard } from 'lucide-react';

const items = [
  { label: 'Главное', href: '/protected', icon: LayoutDashboard },
  { label: 'ЕИС реестр 44-ФЗ', href: '/protected/refusals', icon: FileText },

];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[72px] shrink-0 flex-col bg-slate-900 px-3 py-5 text-white md:w-[248px] md:px-[18px]">
      <div className="mb-7 flex h-[42px] items-center gap-2.5 px-1 text-2xl font-extrabold tracking-normal md:px-0">
        <span className="h-6 w-2 rounded-full bg-orange-500" />
        <span className="hidden md:inline">CRM</span>
      </div>
      <nav className="flex-1">
        <ul className="space-y-1">
          {items.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex min-h-[42px] items-center justify-center gap-3 rounded-lg px-3 text-slate-300 transition-colors hover:bg-white/10 hover:text-white md:justify-start ${
                  pathname === item.href ? 'bg-white/10 text-white' : ''
                }`}
                title={item.label}
              >
                <item.icon size={19} />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
