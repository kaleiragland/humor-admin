import ReadOnlyTable from '@/app/components/ReadOnlyTable';

export default async function CaptionRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  return (
    <ReadOnlyTable
      tableName="caption_requests"
      title="Caption Requests"
      subtitle="Read-only view of caption requests."
      searchParams={params}
    />
  );
}
