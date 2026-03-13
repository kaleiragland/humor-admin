import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EditImageForm from './EditImageForm';

export default async function EditImagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: image, error } = await supabase
    .from('images')
    .select('id, url, is_public, is_common_use, image_description, additional_context, profile_id, created_datetime_utc')
    .eq('id', id)
    .single();

  if (error || !image) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <EditImageForm image={image} />
    </div>
  );
}
