import { NextResponse } from 'next/server';

// Handle Chrome DevTools request to suppress 404 errors
export async function GET() {
  // Return 204 No Content - Chrome DevTools just checks if the file exists
  return new NextResponse(null, { status: 204 });
}











