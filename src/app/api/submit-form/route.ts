import { NextRequest, NextResponse } from 'next/server';
import { ContactFormData } from '@/types/contact';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData: ContactFormData = await request.json();
    
    // Read current submissions
    const dataPath = path.join(process.cwd(), 'src/data/submissions.json');
    const currentData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Add new submission
    const newSubmission = {
      id: Date.now().toString(),
      ...formData,
      submittedAt: new Date().toISOString(),
      status: 'active'
    };
    
    currentData.submissions.push(newSubmission);
    currentData.lastUpdated = new Date().toISOString();
    
    // Write back to file
    fs.writeFileSync(dataPath, JSON.stringify(currentData, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      message: 'Thank you for your interest! We\'ll be in touch soon.' 
    });

  } catch (error) {
    console.error('Form submission error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
