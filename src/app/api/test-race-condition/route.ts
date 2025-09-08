import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simulate two concurrent requests
    const promises = [];
    
    for (let i = 0; i < 3; i++) {
      promises.push(
        fetch('/api/submit-form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userType: 'ud-grad-student',
            email: `test${i}@example.com`,
            major: 'Test Major',
            graduationMonth: 'May',
            graduationYear: '2025',
            selectedClubs: ['1']
          })
        })
      );
    }
    
    const results = await Promise.all(promises);
    const responses = await Promise.all(results.map(r => r.json()));
    
    return NextResponse.json({
      success: true,
      message: 'Race condition test completed',
      results: responses,
      allSuccessful: responses.every(r => r.success)
    });

  } catch (error) {
    console.error('Race condition test error:', error);
    return NextResponse.json(
      { success: false, message: 'Test failed' },
      { status: 500 }
    );
  }
}
