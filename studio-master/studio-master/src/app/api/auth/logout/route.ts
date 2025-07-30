
import { NextResponse } from 'next/server';

// This API is no longer needed.
// Returning a success response to prevent errors if it's somehow called.
export async function POST() {
  return NextResponse.json({ status: 'success', message: 'API is disabled.' }, { status: 200 });
}
