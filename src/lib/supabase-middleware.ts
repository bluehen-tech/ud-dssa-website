import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const createClient = (request: NextRequest, response: NextResponse) => {
  return createMiddlewareClient({ req: request, res: response });
};

