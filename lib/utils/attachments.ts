import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export function fileNameFromPath(path: string) {
  const segment = path.split('/').pop() ?? path
  return segment.replace(/^\d+-/, '')
}

export async function openAttachment(path: string) {
  const supabase = createSupabaseBrowserClient()
  const { data } = await supabase.storage.from('materials').createSignedUrl(path, 3600)
  if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
}
