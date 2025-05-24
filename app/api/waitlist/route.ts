import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if email already exists in waitlist
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('email', email)
      .eq('type', 'waitlist')
      .single();

    if (existingLead) {
      return NextResponse.json(
        { error: 'You are already on the waitlist!' },
        { status: 400 }
      );
    }

    // Insert into leads table as waitlist type
    const { error } = await supabase
      .from('leads')
      .insert([{ 
        email, 
        type: 'waitlist',
        created_at: new Date().toISOString() 
      }]);

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { message: 'Successfully joined the waitlist!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Waitlist signup error:', error);
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    );
  }
} 