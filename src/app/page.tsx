"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ContactForm from '@/components/ContactForm';
import heroWatermark from '@/images/heroWatermark.png';
import { Opportunity, OpportunityType } from '@/types/opportunity';
import { Event } from '@/types/event';
import { createClient } from '@/lib/supabase-browser';
import { useAuth } from '@/contexts/AuthContext';
import { recordToOpportunity } from '@/utils/opportunityTransforms';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(true);
  const { session, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchUpcomingEvents = async () => {
      try {
        const supabase = createClient();
        const nowIso = new Date().toISOString();
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .gte('event_date', nowIso)
          .order('event_date', { ascending: true })
          .limit(3) as any;

        if (error) {
          throw error;
        }

        if (isMounted) {
          setUpcomingEvents(data || []);
        }
      } catch (fetchError) {
        console.error('Error fetching upcoming events:', fetchError);
      }
    };

    fetchUpcomingEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setCurrentEventIndex(0);
  }, [upcomingEvents.length]);

  useEffect(() => {
    let isMounted = true;

    const fetchOpportunities = async () => {
      try {
        setLoadingOpportunities(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from('opportunities')
          .select('*')
          .order('posted_at', { ascending: false })
          .limit(3);

        if (error) {
          throw error;
        }

        if (isMounted) {
          setOpportunities((data || []).map(recordToOpportunity));
        }
      } catch (fetchError) {
        console.error('Error fetching opportunities:', fetchError);
        if (isMounted) {
          setOpportunities([]);
        }
      } finally {
        if (isMounted) {
          setLoadingOpportunities(false);
        }
      }
    };

    fetchOpportunities();

    return () => {
      isMounted = false;
    };
  }, []);

  const scrollToForm = () => {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      const formElement = document.getElementById('contact-form');
      if (formElement) {
        formElement.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  const getTypeColor = (type: OpportunityType): string => {
    const colors: Record<OpportunityType, string> = {
      job: 'bg-green-100 text-green-800 border-green-200',
      internship: 'bg-blue-100 text-blue-800 border-blue-200',
      project: 'bg-purple-100 text-purple-800 border-purple-200',
      research: 'bg-orange-100 text-orange-800 border-orange-200',
      event: 'bg-pink-100 text-pink-800 border-pink-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatEventDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get the 3 most recent opportunities from Supabase
  const recentOpportunities = opportunities.slice(0, 3);
  const showMobileCTA = !authLoading && !session;
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-4 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-4xl w-full space-y-6 relative z-10">
        {/* Mobile-First Call to Action - Prominent for QR code users */}
        {showMobileCTA && (
          <div className={`block sm:hidden transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="bg-blue-primary text-white p-4 rounded-lg shadow-lg text-center mb-4">
              <h2 className="text-xl font-bold mb-2">Join UD's Student-Led Data Science Community!</h2>
              <p className="text-sm mb-3">Students, faculty, and industry partners are encouraged to get connected! Click the button below to get started.</p>
              <button
                onClick={scrollToForm}
                className="px-6 py-3 bg-white text-blue-primary font-bold rounded-md hover:bg-gray-100 hover:scale-105 transition-all duration-200 shadow-md"
              >
                Get Connected Now
              </button>
            </div>
          </div>
        )}

        {/* Upcoming Events Highlight */}
        {upcomingEvents.length > 0 && (
          <div className={`transition-all duration-700 delay-50 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}>
            <div className="relative flex flex-col gap-4 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500 p-5 text-white shadow-xl md:flex-row md:items-center md:justify-between">
              <div className="relative z-10 max-w-xl space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.5em] text-blue-100/80">Upcoming Events</p>
                <h2 className="text-2xl font-bold leading-tight sm:text-3xl">Catch the next DSSA experience</h2>
                <p className="text-sm text-blue-100/80">
                  Stay plugged into workshops, meetups, and collaborations happening now.
                </p>
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/10"
                >
                  Browse all events
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="relative z-10 w-full max-w-sm self-stretch md:max-w-md">
                {upcomingEvents.length > 1 && (
                  <div className="absolute -top-3 right-0 flex gap-2">
                    <button
                      aria-label="Previous event"
                      onClick={() =>
                        setCurrentEventIndex((prev) => (prev - 1 + upcomingEvents.length) % upcomingEvents.length)
                      }
                      className="rounded-full border border-white/30 bg-white/10 p-2 text-white transition hover:bg-white/20"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      aria-label="Next event"
                      onClick={() => setCurrentEventIndex((prev) => (prev + 1) % upcomingEvents.length)}
                      className="rounded-full border border-white/30 bg-white/10 p-2 text-white transition hover:bg-white/20"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}

                {upcomingEvents[currentEventIndex] && (
                  <Link
                    href="/events"
                    className="group block h-full rounded-2xl border border-white/20 bg-white/10 p-4 pt-6 shadow-lg backdrop-blur transition hover:bg-white/15"
                  >
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.4em] text-blue-100/70">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      Featured
                    </div>
                    <h3 className="mt-2 text-xl font-bold leading-snug text-white group-hover:text-white">
                      {upcomingEvents[currentEventIndex].title}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-blue-100/90">
                      {formatEventDateTime(upcomingEvents[currentEventIndex].event_date)}
                    </p>
                    <p className="mt-3 text-sm text-blue-50 line-clamp-3">
                      {upcomingEvents[currentEventIndex].description}
                    </p>
                    {upcomingEvents.length > 1 && (
                      <div className="mt-4 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.4em] text-blue-100/70">
                        {upcomingEvents.map((_, index) => (
                          <span
                            key={`indicator-${index}`}
                            className={`h-1.5 w-1.5 rounded-full transition ${
                              currentEventIndex === index ? 'bg-white' : 'bg-white/30'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hero Section - Zaxxon Style */}
        <div className={`text-center transition-all duration-1000 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {/* Zaxxon-Style Bracket Container */}
          <div className={`relative inline-block transition-all duration-1200 delay-200 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}>
            {/* Content Container - Clean White Background */}
            <div className="relative bg-white p-6 rounded-lg border-2 border-blue-200 overflow-hidden">
              {/* Subtle watermark background */}
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                <Image
                  src={heroWatermark}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 896px, 1152px"
                  className="object-cover rounded-lg"
                  aria-hidden="true"
                />
              </div>
              <div className="relative z-10">
                {/* Frosted glass backdrop for heading */}
                <div className="relative bg-white/60 backdrop-blur-[1px] rounded-lg py-2 mb-4 inline-flex">
                  <h1 className="text-4xl font-bold text-blue-primary sm:text-5xl md:text-6xl drop-shadow-sm m-0 p-0 leading-tight">
                    Data Science Student Association @ UD
                  </h1>
                </div>
                
                {/* Frosted glass backdrop for paragraph */}
                <div className="relative bg-white/60 backdrop-blur-[1px] rounded-lg px-3 py-2 inline-block">
                  <p className="text-xl text-gray-700 font-medium drop-shadow-sm">
                    Graduate student–led association building collaborative tools<br></br>and opportunities within UD's data science ecosystem
                  </p>
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* Mission Section */}
        <div className={`bg-gray-50 p-5 rounded-lg transition-all duration-1000 delay-700 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl font-bold text-blue-primary mb-4">Our Mission</h2>
          <p className="text-lg text-gray-700">
            The Data Science Student Association @ UD showcases graduate student talent, facilitates collaboration between data science clubs and events, and provides hands-on experience with industry tools through technology infrastructure development at UD and with industry partners.
          </p>
        </div>

        {/* Features Section */}
        <div className={`transition-all duration-1000 delay-900 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl font-bold text-blue-primary mb-4 text-center">What We Build</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-blue-primary mb-2">Member Portfolio Platform</h3>
            <p className="text-gray-600">Showcase your own projects and achievements while gaining hands-on experience with modern web and data science tools.</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-blue-primary mb-2">Email Marketing for Interdisciplinary Events</h3>
            <p className="text-gray-600">Discover workshops, hackathons, and networking opportunities across all of UD and inclusive of all data science clubs.</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-blue-primary mb-2">Experiential Learning & Opportunities</h3>
            <p className="text-gray-600">Gain hands-on experience through industry partnerships, internships, and internal infrastructure projects including our new website, member portfolio platform, and email marketing infrastructure.</p>
          </div>
          </div>
        </div>

        {/* Recent Opportunities Section */}
        {recentOpportunities.length > 0 && (
          <div className={`transition-all duration-1000 delay-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-blue-primary">Recent Opportunities</h2>
                <Link
                  href="/opportunities"
                  className="text-blue-primary hover:text-blue-800 hover:underline font-medium flex items-center gap-1"
                >
                  View All
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentOpportunities.map((opportunity) => (
                  <Link
                    key={opportunity.id}
                    href="/opportunities"
                    className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-blue-primary"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-blue-primary flex-1 line-clamp-2">
                        {opportunity.title}
                      </h3>
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(
                          opportunity.type
                        )} whitespace-nowrap`}
                      >
                        {opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium mb-2">{opportunity.organization}</p>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{opportunity.description}</p>
                    <div className="flex flex-col gap-1 text-xs text-gray-600">
                      {opportunity.location && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {opportunity.location}
                        </span>
                      )}
                      {opportunity.deadline && (
                        <span className="flex items-center gap-1 text-red-600 font-medium">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Deadline: {formatDate(opportunity.deadline)}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  Sign in with your <strong>@udel.edu</strong> email to view full details and apply
                </p>
                <p className="text-sm text-gray-600 pt-2 border-t border-blue-200">
                  <strong>Employers:</strong> Have an opportunity to share? Contact us at{' '}
                  <a href="mailto:dsi-info@udel.edu" className="text-blue-primary hover:text-blue-800 hover:underline font-medium">
                    dsi-info@udel.edu
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className={`text-center mb-6 transition-all duration-1000 delay-1100 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <h2 className="text-2xl font-bold text-blue-primary">Ready to connect with UD's data science community?</h2>
            <button
              onClick={scrollToForm}
              className="px-6 py-3 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 hover:scale-105 transition-all duration-200 whitespace-nowrap"
            >
              Get Connected
            </button>
          </div>
          <p className="text-lg text-gray-600 mb-6">
            Whether you're a graduate student showcasing your projects, discovering events, and building infrastructure, or an industry professional looking to collaborate with UD's graduate talent and develop opportunities, UD-DSSA has something for you.
          </p>
        </div>

        {/* Contact Form */}
        <div id="contact-form" className={`transition-all duration-1000 delay-1300 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
        <ContactForm />
        </div>
      </div>
    </div>
  );
} 