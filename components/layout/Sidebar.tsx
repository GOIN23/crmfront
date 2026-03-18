import Link from 'next/link';
import { FileText } from 'lucide-react';

const items = [
  { label: 'Главное', href: '/protected', icon: FileText },
  { label: 'Расторжения 44-ФЗ', href: '/protected/refusals', icon: FileText },

];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 text-2xl font-bold border-b border-gray-800">
        CRM
      </div>
      <nav className="flex-1 px-3 py-6">
        <ul className="space-y-1">
          {items.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}