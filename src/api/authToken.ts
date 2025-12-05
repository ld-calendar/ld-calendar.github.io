// src/api/authToken.ts
import { auth } from '../firebase'

export async function getIdTokenOrThrow(): Promise<string> {
  const user = auth.currentUser
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }
  return await user.getIdToken()
}
