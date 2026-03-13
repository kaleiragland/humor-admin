import ReadOnlyTable from '@/app/components/ReadOnlyTable';

export default async function LlmPromptChainsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  return (
    <ReadOnlyTable
      tableName="llm_prompt_chains"
      title="LLM Prompt Chains"
      subtitle="Read-only view of prompt chains."
      searchParams={params}
    />
  );
}
