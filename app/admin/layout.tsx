import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminNav from '@/app/components/AdminNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav email={user.email || ''} />
      <main className="lg:ml-56 min-h-screen px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
