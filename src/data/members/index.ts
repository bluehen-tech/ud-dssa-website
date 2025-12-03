// Export all member portfolios from officers, members, and alumni folders
// Import member portfolios here as they are created
// Example: import { memberName } from './officers/member-name';
import type { MemberPortfolio } from '@/types/member';

// Import member portfolios here
// TODO: Add member portfolio imports as they are created
// Example:
import { aaron } from './members/aarononserio';
// import { johnDoe } from './members/john-doe';
// import { janeSmith } from './alumni/jane-smith';

// Combine all members
export const allMembers: MemberPortfolio[] = [
  // Add imported members here
  // Example: tejasPawar, johnDoe, janeSmith,
  aaron
];

// Export by role for easy filtering
export const officers = allMembers.filter(m => m.role === 'officer');
export const members = allMembers.filter(m => m.role === 'member');
export const alumni = allMembers.filter(m => m.role === 'alumni');
