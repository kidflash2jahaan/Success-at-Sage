'use client'
import { Upload, DetailedError } from 'tus-js-client'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

// Supabase free tier hard limit. Pro tier allows up to 5 GB.
const PLATFORM_MAX_BYTES = 50 * 1024 * 1024 // 50 MB

export async function uploadFileWithTUS(file: File, unitId: string): Promise<string> {
  if (file.size > PLATFORM_MAX_BYTES) {
    throw new Error(
      `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB — the maximum file size is 50 MB. Please compress the file or split it before uploading.`
    )
  }

  const supabase = createSupabaseBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const path = `attachments/${session.user.id}/${unitId}/${Date.now()}-${file.name}`

  return new Promise((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: 'materials',
        objectName: path,
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
      },
      chunkSize: 6 * 1024 * 1024,
      onError: (err) => {
        if (err instanceof DetailedError) {
          const body = err.originalResponse?.getBody?.() ?? ''
          // Surface the server's message if available, otherwise fall back to the TUS error
          const serverMsg = (() => {
            try { return (JSON.parse(body) as { message?: string }).message } catch { return null }
          })()
          reject(new Error(serverMsg ?? err.message))
        } else {
          reject(err)
        }
      },
      onSuccess: () => resolve(path),
    })
    upload.start()
  })
}
