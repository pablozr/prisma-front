import { IUser } from './IUser'

export interface ILoginRequest {
  email: string
  password: string
}

export interface IAuthEnvelope<T = Record<string, never>> {
  message: string
  data?: T
}

export interface IAuthUserData {
  user: IUser
}

export type ILoginResponse = IAuthEnvelope
export type IMeResponse = IAuthEnvelope<IAuthUserData>
export type ILogoutResponse = IAuthEnvelope
export type IRefreshResponse = IAuthEnvelope
export interface IApiError {
  detail: string | Array<{ loc: (string | number)[]; msg: string; type: string }>
}
