export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'workshop' | 'meeting' | 'social' | 'hackathon' | 'speaker';
  registrationRequired: boolean;
  registrationLink?: string;
  maxAttendees?: number;
  currentAttendees?: number;
  image?: string;
}

export const upcomingEvents: Event[] = [
  {
    id: '1',
    title: 'Introduction to Machine Learning Workshop',
    description: 'Learn the fundamentals of machine learning with hands-on exercises using Python and scikit-learn.',
    date: '2024-02-15',
    time: '6:00 PM - 8:00 PM',
    location: 'Gore Hall 103',
    type: 'workshop',
    registrationRequired: true,
    registrationLink: 'https://forms.gle/example',
    maxAttendees: 30,
    currentAttendees: 15
  },
  {
    id: '2',
    title: 'Data Science Career Panel',
    description: 'Hear from industry professionals about careers in data science, analytics, and AI.',
    date: '2024-02-22',
    time: '7:00 PM - 9:00 PM',
    location: 'Perkins Student Center',
    type: 'speaker',
    registrationRequired: false
  },
  {
    id: '3',
    title: 'Monthly General Meeting',
    description: 'Join us for our monthly meeting to discuss upcoming events, projects, and opportunities.',
    date: '2024-03-01',
    time: '6:30 PM - 7:30 PM',
    location: 'Gore Hall 201',
    type: 'meeting',
    registrationRequired: false
  }
];

export const pastEvents: Event[] = [
  {
    id: '4',
    title: 'Python for Data Analysis Workshop',
    description: 'Introduction to pandas, numpy, and matplotlib for data analysis.',
    date: '2024-01-18',
    time: '6:00 PM - 8:00 PM',
    location: 'Gore Hall 103',
    type: 'workshop',
    registrationRequired: true,
    maxAttendees: 25,
    currentAttendees: 25
  }
];
