import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '../../../services/adminService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, args = [] } = body;

    // Check if the action exists on AdminService as a static method
    const method = (AdminService as any)[action];
    if (typeof method !== 'function') {
      return NextResponse.json(
        { data: null, error: `Invalid action: ${action}`, status: 400 },
        { status: 400 }
      );
    }

    // Call the static method on the server (typeof window === 'undefined')
    const result = await method(...args);
    
    return NextResponse.json(result, { status: result.status || 200 });
  } catch (err: any) {
    console.error('API Error in Admin Route Handler:', err);
    return NextResponse.json(
      { data: null, error: err.message || 'Internal server error', status: 500 },
      { status: 500 }
    );
  }
}
