import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { ContactsListResponse, Contact } from '@/types/contact';

// Helper to verify admin access
async function verifyAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { authorized: false, error: 'Not authenticated', status: 401 };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('admin_flag')
    .eq('id', session.user.id)
    .single();

  if (!profile?.admin_flag) {
    return { authorized: false, error: 'Admin access required', status: 403 };
  }

  return { authorized: true, session };
}

// GET: List contacts with search/filter/pagination
export async function GET(request: NextRequest): Promise<NextResponse<ContactsListResponse>> {
  try {
    const supabase = createClient();
    const auth = await verifyAdmin(supabase);
    
    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        contacts: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 0
      }, { status: auth.status });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const userType = searchParams.get('user_type') || '';
    const status = searchParams.get('status') || '';
    const club = searchParams.get('club') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')));
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? true : false;

    // Build query
    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    if (userType) {
      query = query.eq('user_type', userType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (club) {
      query = query.contains('clubs', [club]);
    }

    // Apply sorting
    const validSortColumns = ['email', 'full_name', 'user_type', 'status', 'created_at', 'updated_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortColumn, { ascending: sortOrder });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: contacts, error, count } = await query;

    if (error) {
      console.error('Error fetching contacts:', error);
      return NextResponse.json({
        success: false,
        contacts: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      }, { status: 500 });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      contacts: (contacts || []) as Contact[],
      total,
      page,
      limit,
      totalPages
    });

  } catch (error) {
    console.error('Error in GET /api/contacts:', error);
    return NextResponse.json({
      success: false,
      contacts: [],
      total: 0,
      page: 1,
      limit: 25,
      totalPages: 0
    }, { status: 500 });
  }
}

// POST: Create a new contact
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const auth = await verifyAdmin(supabase);
    
    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        message: auth.error
      }, { status: auth.status });
    }

    const body = await request.json();
    
    if (!body.email) {
      return NextResponse.json({
        success: false,
        message: 'Email is required'
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        email: body.email.toLowerCase(),
        full_name: body.full_name || null,
        user_type: body.user_type || null,
        major: body.major || null,
        graduation_month: body.graduation_month || null,
        graduation_year: body.graduation_year || null,
        affiliation: body.affiliation || null,
        job_title: body.job_title || null,
        clubs: body.clubs || null,
        is_officer: body.is_officer || false,
        status: body.status || 'subscribed',
        source: 'manual',
        source_metadata: {
          sources: ['manual'],
          last_synced: new Date().toISOString()
        },
        notes: body.notes || null
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({
          success: false,
          message: 'A contact with this email already exists'
        }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Contact created successfully',
      contact: data
    });

  } catch (error) {
    console.error('Error in POST /api/contacts:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create contact'
    }, { status: 500 });
  }
}

// PATCH: Update a contact
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const auth = await verifyAdmin(supabase);
    
    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        message: auth.error
      }, { status: auth.status });
    }

    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json({
        success: false,
        message: 'Contact ID is required'
      }, { status: 400 });
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    const allowedFields = [
      'email', 'full_name', 'user_type', 'major', 'graduation_month',
      'graduation_year', 'affiliation', 'job_title', 'clubs', 'is_officer',
      'status', 'notes'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({
        success: false,
        message: 'Contact not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Contact updated successfully',
      contact: data
    });

  } catch (error) {
    console.error('Error in PATCH /api/contacts:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update contact'
    }, { status: 500 });
  }
}

// DELETE: Delete a contact
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const auth = await verifyAdmin(supabase);
    
    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        message: auth.error
      }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Contact ID is required'
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/contacts:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete contact'
    }, { status: 500 });
  }
}
