import { clearAuthCookie } from '@/lib/auth'
import { NextResponse } from 'next/server'


export async function POST() {
  const headers = clearAuthCookie()
  return NextResponse.json({ success: true }, { status: 200, headers })
}
