import { NextResponse } from 'next/server';
import { AuthAPI } from '@/lib/api/auth';

export async function GET() {
  try {
    const backendHealth = await AuthAPI.health();

    return NextResponse.json({
      ...backendHealth,
      ts: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      service: 'Backend API',
      version: 'unknown',
      ts: new Date().toISOString(),
      error: 'Failed to connect to backend',
    }, { status: 503 });
  }
}
