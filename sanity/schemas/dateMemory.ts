import { defineField, defineArrayMember, defineType } from 'sanity'

export const dateMemory = defineType({
  name: 'dateMemory',
  title: '데이트 기억',
  type: 'document',
  fields: [
    defineField({
      name: 'proposal',
      title: '데이트 신청',
      type: 'reference',
      to: [{ type: 'dateProposal' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'photos',
      title: '사진',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'caption', title: '설명', type: 'string' }),
            defineField({ name: 'alt', title: '대체 텍스트', type: 'string' }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'boyfriendFeedback',
      title: '남자친구 후기',
      type: 'text',
    }),
    defineField({
      name: 'girlfriendFeedback',
      title: '여자친구 후기',
      type: 'text',
    }),
    defineField({
      name: 'rating',
      title: '별점 (1-5)',
      type: 'number',
      validation: (rule) => rule.min(1).max(5),
    }),
    defineField({
      name: 'createdAt',
      title: '작성일',
      type: 'datetime',
    }),
  ],
})
