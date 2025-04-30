export default {
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'For internal reference only',
      initialValue: 'Main Navigation',
    },
    {
      name: 'items',
      title: 'Navigation Items',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'navItem',
          fields: [
            {
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: Rule => Rule.required(),
            },
            {
              name: 'slug',
              title: 'Slug',
              type: 'slug',
              options: {
                source: 'title',
              },
              validation: Rule => Rule.required(),
            },
            {
              name: 'isExternal',
              title: 'Is External Link',
              type: 'boolean',
              initialValue: false,
            },
            {
              name: 'externalUrl',
              title: 'External URL',
              type: 'url',
              hidden: ({ parent }) => !parent?.isExternal,
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
  },
}; 