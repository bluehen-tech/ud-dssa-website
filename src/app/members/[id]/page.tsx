'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { MemberPortfolio } from '@/types/member';

export default function MemberDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [portfolio, setPortfolio] = useState<MemberPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/member-portfolios/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.portfolio) {
          setPortfolio(data.portfolio);
        } else {
          setError('Portfolio not found');
        }
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-8 px-4 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-600 mb-4">{error || 'Portfolio not found'}</p>
          <Link href="/members" className="text-blue-primary hover:underline">← Back to Members</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/members" className="text-blue-primary hover:underline text-sm">← Back to Members</Link>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex flex-col items-center text-center mb-6">
            {portfolio.profileImageUrl ? (
              <div className="w-32 h-32 rounded-full bg-gray-200 mb-4 overflow-hidden">
                <img src={portfolio.profileImageUrl} alt={portfolio.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-4xl font-bold text-blue-primary">{portfolio.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <h1 className="text-3xl font-bold text-blue-primary">{portfolio.name}</h1>
            {portfolio.position && <p className="text-lg font-semibold text-gray-700 mt-1">{portfolio.position}</p>}
            {portfolio.tagline && <p className="text-gray-600 mt-2">{portfolio.tagline}</p>}
            {portfolio.major && <p className="text-sm text-gray-500 mt-1">{portfolio.major}</p>}
            {portfolio.graduationDate && <p className="text-sm text-gray-500">{portfolio.graduationDate}</p>}
          </div>

          {portfolio.bio && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{portfolio.bio}</p>
            </section>
          )}

          {portfolio.skills && portfolio.skills.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {portfolio.skills.flatMap((cat, i) =>
                  (cat.items || []).map((skill, j) => (
                    <span key={`${i}-${j}`} className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                      {skill}
                    </span>
                  ))
                )}
              </div>
            </section>
          )}

          {portfolio.experience && portfolio.experience.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Experience</h2>
              <div className="space-y-4">
                {portfolio.experience.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="border border-gray-200 rounded-lg p-4">
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-700">{item.organization}</p>
                    {(item.startDate || item.endDate || item.location) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {[item.startDate, item.endDate ? `- ${item.endDate}` : '', item.location].filter(Boolean).join(' ')}
                      </p>
                    )}
                    {item.responsibilities && item.responsibilities.length > 0 && (
                      <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 space-y-1">
                        {item.responsibilities.map((point, pointIndex) => (
                          <li key={pointIndex}>{point}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {portfolio.education && portfolio.education.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Education</h2>
              <div className="space-y-4">
                {portfolio.education.map((item, index) => (
                  <div key={`${item.degree}-${index}`} className="border border-gray-200 rounded-lg p-4">
                    <p className="font-semibold text-gray-900">{item.degree}</p>
                    <p className="text-sm text-gray-700">{item.institution}</p>
                    {(item.fieldOfStudy || item.location) && (
                      <p className="text-sm text-gray-600 mt-1">
                        {[item.fieldOfStudy, item.location].filter(Boolean).join(' • ')}
                      </p>
                    )}
                    {(item.startYear || item.endYear) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {[item.startYear, item.endYear ? `- ${item.endYear}` : ''].filter(Boolean).join(' ')}
                      </p>
                    )}
                    {item.gpa !== undefined && item.gpa !== null && (
                      <p className="text-xs text-gray-500 mt-1">GPA: {item.gpa}</p>
                    )}
                    {item.honors && item.honors.length > 0 && (
                      <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 space-y-1">
                        {item.honors.map((honor, honorIndex) => (
                          <li key={honorIndex}>{honor}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {portfolio.projects && portfolio.projects.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Projects</h2>
              <div className="space-y-4">
                {portfolio.projects.map((project, index) => (
                  <div key={`${project.title}-${index}`} className="border border-gray-200 rounded-lg p-4">
                    <p className="font-semibold text-gray-900">{project.title}</p>
                    <p className="text-sm text-gray-700 mt-1">{project.description}</p>
                    {project.technologies && project.technologies.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">Tech: {project.technologies.join(', ')}</p>
                    )}
                    {(project.githubUrl || project.liveUrl) && (
                      <div className="flex gap-3 mt-2 text-sm">
                        {project.githubUrl && (
                          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            GitHub
                          </a>
                        )}
                        {project.liveUrl && (
                          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Live Demo
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {portfolio.achievements && portfolio.achievements.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Achievements & Certifications</h2>
              <div className="space-y-3">
                {portfolio.achievements.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="border border-gray-200 rounded-lg p-4">
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {[item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : '', item.organization, item.date]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                    {item.description && <p className="text-sm text-gray-700 mt-2">{item.description}</p>}
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                        Learn more
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {portfolio.leadershipActivities && portfolio.leadershipActivities.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Leadership & Activities</h2>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {portfolio.leadershipActivities.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {portfolio.coursework && portfolio.coursework.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Relevant Coursework</h2>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {portfolio.coursework.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {portfolio.toolsStack && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Tools & Tech Stack</h2>
              <div className="space-y-2 text-sm text-gray-700">
                {portfolio.toolsStack.languages && portfolio.toolsStack.languages.length > 0 && (
                  <p><span className="font-medium">Languages:</span> {portfolio.toolsStack.languages.join(', ')}</p>
                )}
                {portfolio.toolsStack.mlData && portfolio.toolsStack.mlData.length > 0 && (
                  <p><span className="font-medium">ML/Data:</span> {portfolio.toolsStack.mlData.join(', ')}</p>
                )}
                {portfolio.toolsStack.biAnalytics && portfolio.toolsStack.biAnalytics.length > 0 && (
                  <p><span className="font-medium">BI/Analytics:</span> {portfolio.toolsStack.biAnalytics.join(', ')}</p>
                )}
                {portfolio.toolsStack.cloudDevOps && portfolio.toolsStack.cloudDevOps.length > 0 && (
                  <p><span className="font-medium">Cloud/DevOps:</span> {portfolio.toolsStack.cloudDevOps.join(', ')}</p>
                )}
              </div>
            </section>
          )}

          {portfolio.careerInterests && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Career Interests</h2>
              <div className="space-y-2 text-sm text-gray-700">
                {portfolio.careerInterests.roles && portfolio.careerInterests.roles.length > 0 && (
                  <p><span className="font-medium">Roles:</span> {portfolio.careerInterests.roles.join(', ')}</p>
                )}
                {portfolio.careerInterests.domains && portfolio.careerInterests.domains.length > 0 && (
                  <p><span className="font-medium">Domains:</span> {portfolio.careerInterests.domains.join(', ')}</p>
                )}
                {portfolio.careerInterests.locations && portfolio.careerInterests.locations.length > 0 && (
                  <p><span className="font-medium">Locations:</span> {portfolio.careerInterests.locations.join(', ')}</p>
                )}
                {portfolio.careerInterests.employmentTypes && portfolio.careerInterests.employmentTypes.length > 0 && (
                  <p><span className="font-medium">Employment:</span> {portfolio.careerInterests.employmentTypes.join(', ')}</p>
                )}
              </div>
            </section>
          )}

          {portfolio.availability && (portfolio.availability.startTerm || portfolio.availability.internshipSeason || portfolio.availability.timezone) && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Availability</h2>
              <p className="text-sm text-gray-700">
                {[portfolio.availability.startTerm, portfolio.availability.internshipSeason, portfolio.availability.timezone]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
            </section>
          )}

          {portfolio.portfolioHighlights && portfolio.portfolioHighlights.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Portfolio Highlights</h2>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {portfolio.portfolioHighlights.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {id && (portfolio.resumeFileName || portfolio.resumeUrl) && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Resume</h2>
              <a
                href={`/api/member-portfolios/${id}/resume`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View Resume
              </a>
            </section>
          )}

          {portfolio.links && (portfolio.links.linkedin || portfolio.links.github || portfolio.links.website || portfolio.links.email) && (
            <section className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Connect</h2>
              <div className="flex justify-center gap-4">
                {portfolio.links.linkedin && (
                  <a href={portfolio.links.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" aria-label="LinkedIn">
                    LinkedIn
                  </a>
                )}
                {portfolio.links.github && (
                  <a href={portfolio.links.github} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:underline" aria-label="GitHub">
                    GitHub
                  </a>
                )}
                {portfolio.links.website && (
                  <a href={portfolio.links.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" aria-label="Website">
                    Website
                  </a>
                )}
                {(portfolio.contactPreferences?.allowPublicEmail ?? true) && portfolio.links.email && (
                  <a href={`mailto:${portfolio.links.email}`} className="text-gray-600 hover:underline" aria-label="Email">
                    Email
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
