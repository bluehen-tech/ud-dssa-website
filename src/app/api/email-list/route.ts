import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Fetch the submissions.json file from GitHub
    const fileResponse = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/contents/src/data/submissions.json`, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    });

    if (!fileResponse.ok) {
      throw new Error('Failed to fetch submissions file');
    }

    const fileData = await fileResponse.json();
    const data = JSON.parse(Buffer.from(fileData.content, 'base64').toString());
    
    // Filter active submissions (not unsubscribed)
    const activeSubmissions = data.submissions.filter((sub: any) => 
      sub.status === 'active' && !data.unsubscribed.includes(sub.email)
    );
    
    // Extract email addresses
    const emailList = activeSubmissions.map((sub: any) => ({
      email: sub.email,
      userType: sub.userType,
      submittedAt: sub.submittedAt,
      selectedClubs: sub.selectedClubs || [],
      id: sub.id
    }));
    
    return NextResponse.json({ 
      success: true, 
      emailList,
      total: emailList.length,
      unsubscribed: data.unsubscribed.length,
      lastUpdated: data.lastUpdated
    });

  } catch (error) {
    console.error('Email list error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch email list' },
      { status: 500 }
    );
  }
}