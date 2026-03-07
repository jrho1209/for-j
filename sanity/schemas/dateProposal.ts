import { defineField, defineType } from 'sanity'

export const dateProposal = defineType({
  name: 'dateProposal',
  title: '데이트 신청',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '제목',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'proposedDate',
      title: '제안 날짜',
      type: 'date',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'proposedTime',
      title: '제안 시간',
      type: 'string',
    }),
    defineField({
      name: 'message',
      title: '메시지',
      type: 'text',
    }),
    defineField({
      name: 'status',
      title: '상태',
      type: 'string',
      options: {
        list: [
          { title: '대기 중', value: 'pending' },
          { title: '수락됨', value: 'accepted' },
          { title: '거절됨', value: 'declined' },
          { title: '코스 선택 중', value: 'selecting' },
          { title: '확정됨', value: 'confirmed' },
          { title: '완료됨', value: 'completed' },
          { title: '취소됨', value: 'cancelled' },
        ],
        layout: 'radio',
      },
      initialValue: 'pending',
    }),
    defineField({
      name: 'selectedCourseId',
      title: '선택된 코스 ID',
      type: 'string',
    }),
    defineField({
      name: 'createdBy',
      title: '신청자',
      type: 'string',
    }),
    defineField({
      name: 'createdAt',
      title: '생성일',
      type: 'datetime',
    }),
  ],
})
