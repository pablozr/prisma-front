export type UserRole = 'admin' | 'student' | 'professor' | string

export interface IUser {
  id: number
  institutional_email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at?: string
  updated_at?: string
}
