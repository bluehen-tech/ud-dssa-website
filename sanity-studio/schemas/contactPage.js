export default {
  name: 'contactPage',
  title: 'Contact Page',
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
      name: 'contactInfo',
      title: 'Contact Information',
      type: 'text',
      description: 'General contact information',
    },
    {
      name: 'formFields',
      title: 'Form Fields',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'formField',
          fields: [
            {
              name: 'name',
              title: 'Field Name',
              type: 'string',
              description: 'Technical name for the field (e.g., "email")',
            },
            {
              name: 'label',
              title: 'Field Label',
              type: 'string',
              description: 'Display label for the field (e.g., "Email Address")',
            },
            {
              name: 'type',
              title: 'Field Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Text', value: 'text' },
                  { title: 'Email', value: 'email' },
                  { title: 'Textarea', value: 'textarea' },
                  { title: 'Select', value: 'select' },
                ],
              },
            },
            {
              name: 'required',
              title: 'Required',
              type: 'boolean',
              initialValue: false,
            },
          ],
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title || 'Contact Page',
      };
    },
  },
}; 