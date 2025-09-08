import { NextRequest, NextResponse } from 'next/server';
import { ContactFormData } from '@/types/contact';

export async function POST(request: NextRequest) {
  try {
    const formData: ContactFormData = await request.json();
    
    // Create GitHub issue with form data (no race conditions!)
    const issueTitle = `Form Submission: ${formData.email}`;
    
    const issueBody = `
## Contact Form Submission

**User Type:** ${formData.userType === 'ud-grad-student' ? 'UD Grad Student' : 'Industry/Academic Friend'}
**Email:** ${formData.email}
**Submitted:** ${new Date().toISOString()}

${formData.userType === 'ud-grad-student' ? `
### Student Information
- **Major:** ${(formData as any).major}
- **Graduation:** ${(formData as any).graduationMonth} ${(formData as any).graduationYear}
- **Selected Clubs:** ${(formData as any).selectedClubs?.join(', ') || 'None'}
` : `
### Industry/Academic Information
- **Affiliation:** ${(formData as any).affiliation}
- **Job Title:** ${(formData as any).jobTitle}
- **Selected Clubs:** ${(formData as any).selectedClubs?.join(', ') || 'None'}
- **Notes:** ${(formData as any).notes || 'None'}
`}

## Raw Data
\`\`\`json
${JSON.stringify(formData, null, 2)}
\`\`\`

---
*This issue will be automatically processed by GitHub Actions to update the submissions.json file.*
    `;

    // Create GitHub issue (always succeeds, no race conditions)
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
        labels: ['form-submission', 'pending-processing', formData.userType === 'ud-grad-student' ? 'student' : 'industry']
      })
    });

    if (!githubResponse.ok) {
      const error = await githubResponse.text();
      console.error('GitHub API error:', error);
      throw new Error('Failed to create GitHub issue');
    }

    const issue = await githubResponse.json();
    console.log('Created GitHub issue:', issue.html_url);

    return NextResponse.json({ 
      success: true, 
      message: 'Thank you for your interest! We\'ll be in touch soon.',
      issueUrl: issue.html_url
    });

  } catch (error) {
    console.error('Form submission error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}