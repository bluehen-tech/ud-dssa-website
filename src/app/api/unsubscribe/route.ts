import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { verifyUnsubscribeToken } from '@/lib/unsubscribe-token';

const VALID_UNSUBSCRIBE_LISTS = [
  'all',
  'newsletter',
  'event',
  'opportunity',
  'announcement',
] as const;

type UnsubscribeList = (typeof VALID_UNSUBSCRIBE_LISTS)[number];

function normalizeUnsubscribeList(value: unknown): UnsubscribeList {
  const list = String(value || 'all').toLowerCase();
  return (VALID_UNSUBSCRIBE_LISTS.includes(list as UnsubscribeList)
    ? (list as UnsubscribeList)
    : 'all');
}

function buildSourceMetadata(existingMetadata: any, list: UnsubscribeList) {
  const currentLists = Array.isArray(existingMetadata?.unsubscribed_lists)
    ? existingMetadata.unsubscribed_lists.filter(Boolean)
    : [];

  const updatedLists = list === 'all'
    ? ['all']
    : currentLists.includes('all')
      ? currentLists
      : [...new Set([...currentLists, list])];

  return {
    ...existingMetadata,
    unsubscribed_lists: updatedLists,
    last_unsubscribed_at: new Date().toISOString(),
    unsubscribe_source: 'email_unsubscribe_link',
  };
}

export async function POST(request: NextRequest) {
  try {
    const { email, list, token } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const unsubscribeList = normalizeUnsubscribeList(list);

    // Links minted by this server carry an HMAC token. When one is present it
    // must verify; a verified request is authorised to write with the service
    // role (the caller is anonymous). Tokenless legacy links keep working
    // unless UNSUBSCRIBE_REQUIRE_TOKEN=true.
    let supabase = createClient();
    if (token) {
      if (!verifyUnsubscribeToken(normalizedEmail, unsubscribeList, String(token))) {
        return NextResponse.json(
          { success: false, message: 'This unsubscribe link is invalid or has been altered.' },
          { status: 403 }
        );
      }
      supabase = createAdminClient();
    } else if (process.env.UNSUBSCRIBE_REQUIRE_TOKEN === 'true') {
      return NextResponse.json(
        { success: false, message: 'This unsubscribe link is no longer supported. Please use the link in your most recent email.' },
        { status: 403 }
      );
    }

    const { data: existingContact, error: fetchError } = await supabase
      .from('contacts')
      .select('id, status, source_metadata')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching contact for unsubscribe:', fetchError);
      throw fetchError;
    }

    const sourceMetadata = buildSourceMetadata(existingContact?.source_metadata, unsubscribeList);
    const updatePayload: Record<string, unknown> = {
      source_metadata: sourceMetadata,
    };

    if (unsubscribeList === 'all') {
      updatePayload.status = 'unsubscribed';
    }

    let savedContact;

    if (existingContact?.id) {
      const { data, error } = await supabase
        .from('contacts')
        .update(updatePayload)
        .eq('id', existingContact.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating contact unsubscribe status:', error);
        throw error;
      }
      savedContact = data;
    } else {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          email: normalizedEmail,
          status: unsubscribeList === 'all' ? 'unsubscribed' : 'subscribed',
          source: 'manual',
          source_metadata: sourceMetadata,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting unsubscribe contact:', error);
        throw error;
      }
      savedContact = data;
    }

    return NextResponse.json({
      success: true,
      message: unsubscribeList === 'all'
        ? 'You have been unsubscribed from all UD-DSSA communications.'
        : `You have been unsubscribed from ${unsubscribeList} messages.`,
      contact: savedContact,
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}