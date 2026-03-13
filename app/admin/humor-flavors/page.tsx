import ReadOnlyTable from '@/app/components/ReadOnlyTable';

export default async function HumorFlavorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  return (
    <ReadOnlyTable
      tableName="humor_flavors"
      title="Humor Flavors"
      subtitle="Read-only view of humor flavors."
      searchColumn="name"
      searchParams={params}
    />
  );
}
