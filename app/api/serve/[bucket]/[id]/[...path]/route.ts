import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import JSZip from 'jszip'

// In-memory cache: zipKey → JSZip instance (reused across requests in same lambda)
const zipCache = new Map<string, { zip: JSZip; ts: number }>()
const CACHE_TTL = 3600_000 // 1 hour

const MIME: Record<string, string> = {
  html:  'text/html; charset=utf-8',
  css:   'text/css; charset=utf-8',
  js:    'application/javascript',
  json:  'application/json',
  png:   'image/png',
  jpg:   'image/jpeg',
  jpeg:  'image/jpeg',
  gif:   'image/gif',
  svg:   'image/svg+xml',
  ico:   'image/x-icon',
  woff:  'font/woff',
  woff2: 'font/woff2',
  ttf:   'font/ttf',
  webp:  'image/webp',
}

function getMime(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return MIME[ext] ?? 'application/octet-stream'
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bucket: string; id: string; path: string[] }> }
) {
  const { bucket, id, path } = await params

  // Validate bucket is one of the known ones
  if (!['design-systems', 'referencias'].includes(bucket)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const filePath = path.join('/')
  const zipKey = `${bucket}/${id}`

  try {
    // Check cache
    const cached = zipCache.get(zipKey)
    let zip: JSZip

    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      zip = cached.zip
    } else {
      // Download ZIP from Supabase Storage
      const supabase = await createClient()
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(`${id}.zip`)

      if (error || !data) {
        return new NextResponse('Not found', { status: 404 })
      }

      const buffer = await data.arrayBuffer()
      zip = await JSZip.loadAsync(buffer)
      zipCache.set(zipKey, { zip, ts: Date.now() })
    }

    const file = zip.file(filePath)
    if (!file) {
      return new NextResponse('File not found in zip', { status: 404 })
    }

    const content = await file.async('arraybuffer')
    const mime = getMime(filePath)

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'private, max-age=3600',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    })
  } catch (err) {
    console.error('[serve-zip]', err)
    return new NextResponse('Internal error', { status: 500 })
  }
}
