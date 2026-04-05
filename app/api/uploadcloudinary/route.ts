// app/api/uploadCloudinary/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Cloudinary config (direct, no env)
const CLOUD_NAME = 'dh9jjpbte'
const UPLOAD_PRESET = 'mPair-Technologies'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const cloudFormData = new FormData()
    cloudFormData.append('file', file)
    cloudFormData.append('upload_preset', UPLOAD_PRESET)
    cloudFormData.append('cloud_name', CLOUD_NAME)

    // detect file type: image or raw
    const isPDF = file.type === 'application/pdf'
    const endpoint = isPDF
      ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`
      : `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

    const res = await fetch(endpoint, {
      method: 'POST',
      body: cloudFormData,
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data?.error?.message || 'Cloudinary upload failed')

    // return uploaded file URL
    return NextResponse.json({ url: data.secure_url })
  } catch (err: any) {
    console.error('Cloudinary upload error:', err.message)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}