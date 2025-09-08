import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Create GitHub issue for unsubscribe request (no race conditions!)
    const issueTitle = `Unsubscribe Request: ${email}`;
    const issueBody = `
## Unsubscribe Request

**Email:** ${email}
**Requested:** ${new Date().toISOString()}

---
*This issue will be automatically processed by GitHub Actions to update the submissions.json file.*
    `;

    const githubResponse = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody,
        labels: ['unsubscribe-request', 'pending-processing']
      })
    });

    if (!githubResponse.ok) {
      const error = await githubResponse.text();
      console.error('GitHub API error:', error);
      throw new Error('Failed to create unsubscribe request');
    }

    const issue = await githubResponse.json();
    console.log('Created unsubscribe request:', issue.html_url);

    return NextResponse.json({ 
      success: true, 
      message: 'You have been successfully unsubscribed.',
      issueUrl: issue.html_url
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}