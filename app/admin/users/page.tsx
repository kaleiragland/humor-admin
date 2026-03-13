import { createClient } from '@/lib/supabase/server';

export default async function UsersPage() {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_datetime_utc', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Users / Profiles</h1>
      <p className="text-slate-400 text-sm">Read-only view of all user profiles.</p>

      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-4 text-red-300 text-sm">
          Error loading profiles: {error.message}
        </div>
      )}

      {(!profiles || profiles.length === 0) ? (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-12 text-center">
          <p className="text-slate-400">No profiles found. This may be due to RLS policies restricting access.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-800">
              <tr>
                {Object.keys(profiles[0])
                  .filter(k => k !== 'embedding')
                  .map((key) => (
                    <th key={key} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {key}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-slate-800/50">
                  {Object.entries(profile)
                    .filter(([k]) => k !== 'embedding')
                    .map(([key, value]) => (
                      <td key={key} className="px-4 py-3 text-slate-300 max-w-xs truncate">
                        {value === null
                          ? <span className="text-slate-600 italic">null</span>
                          : typeof value === 'boolean'
                          ? <span className={value ? 'text-emerald-400' : 'text-red-400'}>{String(value)}</span>
                          : String(value)}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
