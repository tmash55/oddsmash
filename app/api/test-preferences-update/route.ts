import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/libs/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, testBooks } = await request.json()
    
    if (!userId || !testBooks) {
      return NextResponse.json({ error: 'Missing userId or testBooks' }, { status: 400 })
    }

    const supabase = createClient()
    
    console.log('🧪 Test API: Starting preference update test', {
      userId,
      testBooks,
      testBooksType: typeof testBooks,
      isArray: Array.isArray(testBooks)
    })

    // First, check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('🧪 Test API: Current user check', {
      user: user?.id,
      userError: userError?.message,
      matchesUserId: user?.id === userId
    })

    // Check if record exists
    const { data: existingData, error: selectError } = await supabase
      .from('user_preferences')
      .select('id, preferred_sportsbooks')
      .eq('id', userId)
      .single()

    console.log('🧪 Test API: Existing record', {
      exists: !!existingData,
      currentBooks: existingData?.preferred_sportsbooks,
      selectError: selectError?.code
    })

    // Try direct update
    const { data: updateData, error: updateError } = await supabase
      .from('user_preferences')
      .update({ 
        preferred_sportsbooks: testBooks,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()

    console.log('🧪 Test API: Direct update result', {
      updateData,
      updateError: updateError?.code,
      updateErrorMessage: updateError?.message
    })

    // Try upsert
    const { data: upsertData, error: upsertError } = await supabase
      .from('user_preferences')
      .upsert({
        id: userId,
        preferred_sportsbooks: testBooks,
        updated_at: new Date().toISOString()
      })
      .select()

    console.log('🧪 Test API: Upsert result', {
      upsertData,
      upsertError: upsertError?.code,
      upsertErrorMessage: upsertError?.message
    })

    // Verify the change with a fresh query
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_preferences')
      .select('id, preferred_sportsbooks, updated_at')
      .eq('id', userId)
      .single()

    console.log('🧪 Test API: Verification', {
      verifyData,
      verifyError: verifyError?.code,
      booksMatch: JSON.stringify(verifyData?.preferred_sportsbooks) === JSON.stringify(testBooks),
      expectedBooks: testBooks,
      actualBooks: verifyData?.preferred_sportsbooks,
      updatedAt: verifyData?.updated_at
    })

    // Check if there are multiple records for this user (shouldn't be, but let's verify)
    const { data: allRecords, error: allError } = await supabase
      .from('user_preferences')
      .select('id, preferred_sportsbooks, updated_at')
      .eq('id', userId)

    console.log('🧪 Test API: All records for user', {
      recordCount: allRecords?.length,
      allRecords,
      allError: allError?.code
    })

    // Wait a moment and check again to see if there's a delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const { data: delayedCheck, error: delayedError } = await supabase
      .from('user_preferences')
      .select('preferred_sportsbooks, updated_at')
      .eq('id', userId)
      .single()

    console.log('🧪 Test API: Delayed verification (1s later)', {
      delayedCheck,
      delayedError: delayedError?.code,
      stillMatches: JSON.stringify(delayedCheck?.preferred_sportsbooks) === JSON.stringify(testBooks)
    })

    return NextResponse.json({
      success: true,
      results: {
        user: user?.id,
        existing: existingData,
        updateResult: { data: updateData, error: updateError },
        upsertResult: { data: upsertData, error: upsertError },
        verification: verifyData
      }
    })

  } catch (error) {
    console.error('🧪 Test API: Error', error)
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
