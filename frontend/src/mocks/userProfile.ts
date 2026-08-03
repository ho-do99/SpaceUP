export interface UserProfile {
  readonly name: string
  readonly email: string
  readonly phone: string
}

export const userProfile: UserProfile = {
  name: '홍길동',
  email: 'user@spaceup.kr',
  phone: '010-1234-5678',
}
