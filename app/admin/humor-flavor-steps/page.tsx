import ReadOnlyTable from '@/app/components/ReadOnlyTable';

export default async function HumorFlavorStepsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  return (
    <ReadOnlyTable
      tableName="humor_flavor_steps"
      title="Humor Flavor Steps"
      subtitle="Read-only view of humor flavor steps."
      searchParams={params}
    />
  );
}
