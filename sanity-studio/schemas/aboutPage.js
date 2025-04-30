export default {
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Page Title',
      type: 'string',
      description: 'Title of the page (for SEO)',
    },
    {
      name: 'description',
      title: 'Page Description',
      type: 'text',
      description: 'Description of the page (for SEO)',
    },
    {
      name: 'content',
      title: 'Page Content',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Main content for the about page',
    },
    {
      name: 'teamMembers',
      title: 'Team Members',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'teamMember' }] }],
      description: 'References to team members',
    },
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title || 'About Page',
      };
    },
  },
}; 