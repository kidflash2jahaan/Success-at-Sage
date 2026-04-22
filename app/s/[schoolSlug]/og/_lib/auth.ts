// Admin gate for /og/* routes. Returns a 401 Response if the caller
// isn't an authenticated admin — otherwise null (proceed).
import { getCurrentUser } from '@/lib/auth'

export async function requireAdminResponse(): Promise<Response | null> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return new Response('Forbidden', { status: 403 })
    }
    return null
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }
}

// Build a set of response headers for an OG image response.
// When `?download=1` is present, force a file download with a filename.
export function responseHeaders(
  request: Request,
  filename: string,
): Record<string, string> {
  const url = new URL(request.url)
  const download = url.searchParams.get('download') === '1'
  const headers: Record<string, string> = {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  }
  if (download) {
    headers['Content-Disposition'] = `attachment; filename="${filename}"`
  }
  return headers
}
