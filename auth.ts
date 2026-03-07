import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: '아이디', type: 'text' },
        password: { label: '비밀번호', type: 'password' },
      },
      authorize: async (credentials) => {
        const { username, password } = credentials as {
          username: string
          password: string
        }

        if (
          username === process.env.BOYFRIEND_USERNAME &&
          password === process.env.BOYFRIEND_PASSWORD
        ) {
          return {
            id: 'boyfriend',
            name: process.env.BOYFRIEND_NAME || 'James',
            role: 'boyfriend',
          }
        }

        if (
          username === process.env.GIRLFRIEND_USERNAME &&
          password === process.env.GIRLFRIEND_PASSWORD
        ) {
          return {
            id: 'girlfriend',
            name: process.env.GIRLFRIEND_NAME || 'J',
            role: 'girlfriend',
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = (user as any).id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = token.role
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.AUTH_SECRET,
})
