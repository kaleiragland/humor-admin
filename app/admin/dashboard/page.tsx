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

  // Fetch votes from the last 30 days, paginated past the 1000-row default limit
  const thirtyDaysAgoDate = new Date();
  thirtyDaysAgoDate.setUTCDate(thirtyDaysAgoDate.getUTCDate() - 30);
  thirtyDaysAgoDate.setUTCHours(0, 0, 0, 0);
  const thirtyDaysAgoIso = thirtyDaysAgoDate.toISOString();

  type VoteRow = {
    caption_id: string;
    vote_value: number;
    created_datetime_utc: string;
    created_by_user_id?: string | null;
  };
  const allVotes: VoteRow[] = [];
  const pageSize = 1000;
  for (let offset = 0; offset < 50000; offset += pageSize) {
    const { data, error } = await supabase
      .from('caption_votes')
      .select('caption_id, vote_value, created_datetime_utc, created_by_user_id')
      .gte('created_datetime_utc', thirtyDaysAgoIso)
      .range(offset, offset + pageSize - 1);
    if (error || !data || data.length === 0) break;
    allVotes.push(...(data as VoteRow[]));
    if (data.length < pageSize) break;
  }

  // Aggregate per-caption up/down counts
  const captionEngagement: Record<string, { up: number; down: number }> = {};
  for (const v of allVotes ?? []) {
    const bucket = captionEngagement[v.caption_id] || { up: 0, down: 0 };
    if (v.vote_value === 1) bucket.up++;
    else if (v.vote_value === -1) bucket.down++;
    captionEngagement[v.caption_id] = bucket;
  }

  const topCaptionIds = Object.entries(captionEngagement)
    .map(([id, { up }]) => ({ id, count: up }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Most engaged = most total votes (up + down)
  const mostEngagedIds = Object.entries(captionEngagement)
    .map(([id, { up, down }]) => ({ id, up, down, total: up + down }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Controversial = near 50/50 split with at least 3 votes
  const controversialIds = Object.entries(captionEngagement)
    .map(([id, { up, down }]) => {
      const total = up + down;
      const ratio = total > 0 ? Math.min(up, down) / total : 0;
      return { id, up, down, total, ratio };
    })
    .filter(c => c.total >= 3)
    .sort((a, b) => b.ratio - a.ratio || b.total - a.total)
    .slice(0, 5);

  // Hydrate all referenced caption ids in one query
  const captionIdsToLookUp = Array.from(new Set([
    ...topCaptionIds.map(c => c.id),
    ...mostEngagedIds.map(c => c.id),
    ...controversialIds.map(c => c.id),
  ]));

  const captionLookup: Record<string, string> = {};
  if (captionIdsToLookUp.length > 0) {
    const { data: captionData } = await supabase
      .from('captions')
      .select('id, content')
      .in('id', captionIdsToLookUp);
    for (const c of captionData ?? []) {
      captionLookup[c.id] = c.content;
    }
  }

  const topCaptionDetails = topCaptionIds.map(tc => ({
    id: tc.id,
    content: captionLookup[tc.id] || 'Unknown',
    votes: tc.count,
  }));

  const mostEngagedCaptions = mostEngagedIds.map(c => ({
    ...c,
    content: captionLookup[c.id] || 'Unknown',
  }));

  const controversialCaptions = controversialIds.map(c => ({
    ...c,
    content: captionLookup[c.id] || 'Unknown',
  }));

  // Daily rating volume over the last 30 days
  const dayKeys: string[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    dayKeys.push(d.toISOString().split('T')[0]);
  }
  const dayCounts: Record<string, number> = Object.fromEntries(dayKeys.map(k => [k, 0]));
  for (const v of allVotes ?? []) {
    const day = v.created_datetime_utc?.slice(0, 10);
    if (day && day in dayCounts) dayCounts[day]++;
  }
  const dailyVotes = dayKeys.map(day => ({ day, count: dayCounts[day] }));
  const maxDailyVotes = Math.max(1, ...dailyVotes.map(d => d.count));
  const totalVotesInWindow = dailyVotes.reduce((sum, d) => sum + d.count, 0);

  // Rating coverage: how many captions have been rated at all
  const ratedCaptionCount = Object.keys(captionEngagement).length;
  const unratedCaptionCount = Math.max(0, (captionCount ?? 0) - ratedCaptionCount);
  const coveragePct = captionCount
    ? ((ratedCaptionCount / captionCount) * 100).toFixed(1)
    : '0';

  // Top raters (within the last 30 days)
  const raterCounts: Record<string, number> = {};
  for (const v of allVotes) {
    if (v.created_by_user_id) {
      raterCounts[v.created_by_user_id] = (raterCounts[v.created_by_user_id] || 0) + 1;
    }
  }
  const topRaters = Object.entries(raterCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

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
                  <p className="text-sm text-slate-300 truncate font-mono" title={profileId}>{profileId}</p>
                </div>
                <span className="text-sm text-slate-400 flex-shrink-0">{count} images</span>
              </div>
            ))}
            {topUploaders.length === 0 && (
              <p className="text-sm text-slate-500">No upload data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Caption Rating Activity */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Caption Rating Activity</h2>
          <p className="text-sm text-slate-400 mt-1">
            How users have been rating captions over the last 30 days.
          </p>
        </div>

        {/* Rating coverage cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
            <p className="text-sm text-slate-400">Rated Captions</p>
            <p className="text-2xl font-bold text-white mt-1">
              {ratedCaptionCount.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">{coveragePct}% of all captions</p>
          </div>
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
            <p className="text-sm text-slate-400">Unrated Captions</p>
            <p className="text-2xl font-bold text-white mt-1">
              {unratedCaptionCount.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">Awaiting first vote</p>
          </div>
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
            <p className="text-sm text-slate-400">Avg Votes / Rated Caption</p>
            <p className="text-2xl font-bold text-white mt-1">
              {ratedCaptionCount && voteCount
                ? (voteCount / ratedCaptionCount).toFixed(2)
                : '0'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Engagement depth</p>
          </div>
        </div>

        {/* Daily rating activity chart */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Rating Volume (Last 30 Days)</h3>
            <span className="text-xs text-slate-500">
              {totalVotesInWindow.toLocaleString()} votes in window
            </span>
          </div>
          {totalVotesInWindow === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-slate-500">
              No votes cast in the last 30 days.
            </div>
          ) : (
            <div className="flex gap-1">
              {dailyVotes.map(({ day, count }) => (
                <div key={day} className="flex-1 flex flex-col items-center group">
                  <div className="h-40 w-full flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-t min-h-[2px] transition group-hover:from-purple-500 group-hover:to-pink-400"
                      style={{ height: `${(count / maxDailyVotes) * 100}%` }}
                      title={`${day}: ${count} votes`}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1">
                    {day.slice(8)}
                  </span>
                  <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition absolute -mt-2">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most engaged + Controversial */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Most Engaged Captions</h3>
            <p className="text-xs text-slate-500 mb-4">Most votes in the last 30 days</p>
            <div className="space-y-3">
              {mostEngagedCaptions.map((cap, i) => (
                <div key={cap.id} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-600/30 text-pink-300 text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">&quot;{cap.content}&quot;</p>
                    <p className="text-xs text-slate-500">
                      {cap.total} total · {cap.up} up · {cap.down} down
                    </p>
                  </div>
                </div>
              ))}
              {mostEngagedCaptions.length === 0 && (
                <p className="text-sm text-slate-500">No vote data available</p>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Most Controversial Captions</h3>
            <p className="text-xs text-slate-500 mb-4">Closest to a 50/50 split (min 3 votes)</p>
            <div className="space-y-3">
              {controversialCaptions.map((cap, i) => (
                <div key={cap.id} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-600/30 text-orange-300 text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">&quot;{cap.content}&quot;</p>
                    <p className="text-xs text-slate-500">
                      {(cap.ratio * 100).toFixed(0)}% split · {cap.up} up · {cap.down} down
                    </p>
                  </div>
                </div>
              ))}
              {controversialCaptions.length === 0 && (
                <p className="text-sm text-slate-500">Not enough votes yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Top raters */}
        {topRaters.length > 0 && (
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
            <div className="flex items-baseline justify-between mb-1">
              <h3 className="text-lg font-semibold text-white">Top Raters</h3>
              <span className="text-xs text-slate-500">
                {topRaters.length} active rater{topRaters.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Most votes cast in the last 30 days</p>
            <div className="space-y-3">
              {topRaters.map(([userId, count], i) => (
                <div key={userId} className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-600/30 text-amber-300 text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate font-mono" title={userId}>
                      {userId}
                    </p>
                  </div>
                  <span className="text-sm text-slate-400 flex-shrink-0">{count} votes</span>
                </div>
              ))}
            </div>
            {topRaters.length === 1 && (
              <p className="text-xs text-slate-500 mt-4 italic">
                Only one user has rated captions so far.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
