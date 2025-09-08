import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Read current data
    const dataPath = path.join(process.cwd(), 'src/data/submissions.json');
    const currentData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Add to unsubscribed list
    if (!currentData.unsubscribed.includes(email)) {
      currentData.unsubscribed.push(email);
    }
    
    // Update submission status
    currentData.submissions = currentData.submissions.map((sub: any) => 
      sub.email === email ? { ...sub, status: 'unsubscribed' } : sub
    );
    
    currentData.lastUpdated = new Date().toISOString();
    
    // Write back to file
    fs.writeFileSync(dataPath, JSON.stringify(currentData, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      message: 'You have been successfully unsubscribed.' 
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
