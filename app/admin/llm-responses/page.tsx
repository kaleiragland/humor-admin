import ReadOnlyTable from '@/app/components/ReadOnlyTable';

export default async function LlmResponsesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  return (
    <ReadOnlyTable
      tableName="llm_model_responses"
      title="LLM Responses"
      subtitle="Read-only view of LLM model responses."
      searchParams={params}
      pageSize={20}
      excludeColumns={['embedding', 'llm_system_prompt', 'llm_user_prompt']}
    />
  );
}
