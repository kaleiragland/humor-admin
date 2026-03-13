'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const navSections = [
  {
    label: 'Overview',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/users', label: 'Users' },
      { href: '/admin/images', label: 'Images' },
      { href: '/admin/captions', label: 'Captions' },
      { href: '/admin/caption-requests', label: 'Caption Requests' },
      { href: '/admin/caption-examples', label: 'Caption Examples' },
    ],
  },
  {
    label: 'Humor',
    items: [
      { href: '/admin/humor-flavors', label: 'Humor Flavors' },
      { href: '/admin/humor-flavor-steps', label: 'Flavor Steps' },
      { href: '/admin/humor-mix', label: 'Humor Mix' },
    ],
  },
  {
    label: 'LLM',
    items: [
      { href: '/admin/llm-models', label: 'Models' },
      { href: '/admin/llm-providers', label: 'Providers' },
      { href: '/admin/llm-prompt-chains', label: 'Prompt Chains' },
      { href: '/admin/llm-responses', label: 'Responses' },
    ],
  },
  {
    label: 'Config',
    items: [
      { href: '/admin/terms', label: 'Terms' },
      { href: '/admin/allowed-signup-domains', label: 'Allowed Domains' },
      { href: '/admin/whitelisted-emails', label: 'Whitelisted Emails' },
    ],
  },
];

export default function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <span className="text-white font-bold text-lg">Humor Admin</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition ${
                    pathname.startsWith(item.href)
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-3">
        <p className="text-xs text-slate-400 truncate">{email}</p>
        <button
          onClick={handleSignOut}
          className="w-full rounded-lg bg-red-600/20 border border-red-600/50 px-4 py-2 text-sm text-red-300 hover:bg-red-600/30 transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-700 px-4 h-14 flex items-center justify-between">
        <span className="text-white font-bold">Humor Admin</span>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-slate-300 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-700 z-50">
            {sidebar}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-56 lg:flex-col bg-slate-900 border-r border-slate-700">
        {sidebar}
      </aside>
    </>
  );
}
