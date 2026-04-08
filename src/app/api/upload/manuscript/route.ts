import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: author, error: authorError } = await supabase
    .from('authors')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (authorError || !author) {
    return NextResponse.json({ error: 'Author profile not found' }, { status: 404 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
  }

  const fileName = `manuscript-${author.id}-${Date.now()}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('manuscripts')
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  // Trigger voice extraction agent asynchronously (fire-and-forget)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  fetch(`${appUrl}/api/agents/voice-extraction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorId: author.id, fileName }),
  }).catch((err: unknown) => {
    console.error('Voice extraction trigger failed:', err)
  })

  return NextResponse.json({
    status: 'processing',
    fileName,
    message: 'Manuscript uploaded. Voice analysis in progress.',
  })
}
