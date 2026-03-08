import { defineField, defineArrayMember, defineType } from 'sanity'

export const dateCourse = defineType({
  name: 'dateCourse',
  title: '데이트 코스',
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
      name: 'title',
      title: '코스 제목',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: '코스 설명',
      type: 'text',
    }),
    defineField({
      name: 'places',
      title: '장소 목록',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'name', title: '장소명', type: 'string' }),
            defineField({ name: 'description', title: '설명', type: 'text' }),
            defineField({ name: 'address', title: '주소', type: 'string' }),
            defineField({ name: 'url', title: '네이버 플레이스 URL', type: 'string' }),
            defineField({ name: 'emoji', title: '이모지', type: 'string' }),
            defineField({ name: 'lat', title: '위도', type: 'number' }),
            defineField({ name: 'lng', title: '경도', type: 'number' }),
            defineField({ name: 'image', title: '이미지', type: 'image' }),
            defineField({ name: 'images', title: '이미지 목록', type: 'array', of: [{ type: 'image' }] }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'order',
      title: '순서',
      type: 'number',
      initialValue: 0,
    }),
  ],
})
