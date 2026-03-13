import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch counts
  const [
    { count: imageCount },
    { count: captionCount },
    { count: voteCount },
    { count: profileCount },
  ] = await Promise.all([
    supabase.from('images').select('*', { count: 'exact', head: true }),
    supabase.from('captions').select('*', { count: 'exact', head: true }),
    supabase.from('caption_votes').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ]);

  // Public vs private images
  const { count: publicImages } = await supabase
    .from('images')
    .select('*', { count: 'exact', head: true })
    .eq('is_public', true);

  const { count: commonUseImages } = await supabase
    .from('images')
    .select('*', { count: 'exact', head: true })
    .eq('is_common_use', true);

  // Public vs private captions
  const { count: publicCaptions } = await supabase
    .from('captions')
    .select('*', { count: 'exact', head: true })
    .eq('is_public', true);

  // Upvotes vs downvotes
  const { count: upvotes } = await supabase
    .from('caption_votes')
    .select('*', { count: 'exact', head: true })
    .eq('vote_value', 1);

  const { count: downvotes } = await supabase
    .from('caption_votes')
    .select('*', { count: 'exact', head: true })
    .eq('vote_value', -1);

  // Recent images (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: recentImages } = await supabase
    .from('images')
    .select('*', { count: 'exact', head: true })
    .gte('created_datetime_utc', weekAgo);

  const { count: recentCaptions } = await supabase
    .from('captions')
    .select('*', { count: 'exact', head: true })
    .gte('created_datetime_utc', weekAgo);

  const { count: recentVotes } = await supabase
    .from('caption_votes')
    .select('*', { count: 'exact', head: true })
    .gte('created_datetime_utc', weekAgo);

  // Top voted captions
  const { data: topCaptions } = await supabase
    .from('caption_votes')
    .select('caption_id, vote_value')
    .eq('vote_value', 1);

  const captionVoteCounts: Record<string, number> = {};
  for (const v of topCaptions ?? []) {
    captionVoteCounts[v.caption_id] = (captionVoteCounts[v.caption_id] || 0) + 1;
  }
  const topCaptionIds = Object.entries(captionVoteCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ id, count }));

  let topCaptionDetails: { id: string; content: string; votes: number }[] = [];
  if (topCaptionIds.length > 0) {
    const { data: captionData } = await supabase
      .from('captions')
      .select('id, content')
      .in('id', topCaptionIds.map(c => c.id));

    topCaptionDetails = topCaptionIds.map(tc => {
      const caption = captionData?.find(c => c.id === tc.id);
      return {
        id: tc.id,
        content: caption?.content || 'Unknown',
        votes: tc.count,
      };
    });
  }

  // Most active uploaders (by image count)
  const { data: allImages } = await supabase
    .from('images')
    .select('profile_id');

  const uploaderCounts: Record<string, number> = {};
  for (const img of allImages ?? []) {
    if (img.profile_id) {
      uploaderCounts[img.profile_id] = (uploaderCounts[img.profile_id] || 0) + 1;
    }
  }
  const topUploaders = Object.entries(uploaderCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Captions per image ratio
  const captionsPerImage = imageCount && captionCount
    ? (captionCount / imageCount).toFixed(1)
    : '0';

  // Votes per caption ratio
  const votesPerCaption = captionCount && voteCount
    ? (voteCount / captionCount).toFixed(2)
    : '0';

  // Approval rate
  const approvalRate = upvotes && voteCount
    ? ((upvotes / voteCount) * 100).toFixed(1)
    : '0';

  const stats = [
    { label: 'Total Users', value: profileCount ?? 0, color: 'from-blue-500 to-blue-700' },
    { label: 'Total Images', value: imageCount ?? 0, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Total Captions', value: captionCount ?? 0, color: 'from-purple-500 to-purple-700' },
    { label: 'Total Votes', value: voteCount ?? 0, color: 'from-amber-500 to-amber-700' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>

      {/* Main stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl bg-gradient-to-br ${stat.color} p-6 shadow-lg`}
          >
            <p className="text-sm font-medium text-white/80">{stat.label}</p>
            <p className="text-3xl font-bold text-white mt-1">
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <p className="text-sm text-slate-400">Captions per Image</p>
          <p className="text-2xl font-bold text-white mt-1">{captionsPerImage}</p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <p className="text-sm text-slate-400">Votes per Caption</p>
          <p className="text-2xl font-bold text-white mt-1">{votesPerCaption}</p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <p className="text-sm text-slate-400">Approval Rate</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{approvalRate}%</p>
        </div>
      </div>

      {/* Activity + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Last 7 Days</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">New Images</span>
              <span className="text-white font-semibold bg-emerald-600/20 px-3 py-1 rounded-full text-sm">
                +{recentImages ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">New Captions</span>
              <span className="text-white font-semibold bg-purple-600/20 px-3 py-1 rounded-full text-sm">
                +{recentCaptions ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">New Votes</span>
              <span className="text-white font-semibold bg-amber-600/20 px-3 py-1 rounded-full text-sm">
                +{recentVotes ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Content breakdown */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Content Breakdown</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Public Images</span>
                <span className="text-white">{publicImages ?? 0} / {imageCount ?? 0}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${imageCount ? ((publicImages ?? 0) / imageCount) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Common Use Images</span>
                <span className="text-white">{commonUseImages ?? 0} / {imageCount ?? 0}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${imageCount ? ((commonUseImages ?? 0) / imageCount) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Public Captions</span>
                <span className="text-white">{publicCaptions ?? 0} / {captionCount ?? 0}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${captionCount ? ((publicCaptions ?? 0) / captionCount) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Upvotes vs Downvotes</span>
                <span className="text-white">{upvotes ?? 0} up / {downvotes ?? 0} down</span>
              </div>
              <div className="w-full bg-red-500/50 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${voteCount ? ((upvotes ?? 0) / voteCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Captions + Top Uploaders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top Voted Captions</h2>
          <div className="space-y-3">
            {topCaptionDetails.map((cap, i) => (
              <div key={cap.id} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-600/30 text-amber-300 text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate">&quot;{cap.content}&quot;</p>
                  <p className="text-xs text-slate-500">{cap.votes} upvotes</p>
                </div>
              </div>
            ))}
            {topCaptionDetails.length === 0 && (
              <p className="text-sm text-slate-500">No vote data available</p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top Uploaders</h2>
          <div className="space-y-3">
            {topUploaders.map(([profileId, count], i) => (
              <div key={profileId} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate font-mono">{profileId.slice(0, 8)}...</p>
                </div>
                <span className="text-sm text-slate-400">{count} images</span>
              </div>
            ))}
            {topUploaders.length === 0 && (
              <p className="text-sm text-slate-500">No upload data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
