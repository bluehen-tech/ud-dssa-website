import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Read submissions data
    const dataPath = path.join(process.cwd(), 'src/data/submissions.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Filter active submissions (not unsubscribed)
    const activeSubmissions = data.submissions.filter((sub: any) => 
      sub.status === 'active' && !data.unsubscribed.includes(sub.email)
    );
    
    // Extract email addresses
    const emailList = activeSubmissions.map((sub: any) => ({
      email: sub.email,
      userType: sub.userType,
      submittedAt: sub.submittedAt,
      selectedClubs: sub.selectedClubs || []
    }));
    
    return NextResponse.json({ 
      success: true, 
      emailList,
      total: emailList.length,
      unsubscribed: data.unsubscribed.length
    });

  } catch (error) {
    console.error('Email list error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch email list' },
      { status: 500 }
    );
  }
}
