import { IUser } from './IUser'

export interface ILoginRequest {
  email: string
  password: string
}

export interface IGoogleLoginRequest {
  credential: string
}

export interface IForgetPasswordRequest {
  email: string
}

export interface IValidateCodeRequest {
  code: string
}

export interface IUpdatePasswordRequest {
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
export type IGoogleLoginResponse = IAuthEnvelope
export type IMeResponse = IAuthEnvelope<IAuthUserData>
export type ILogoutResponse = IAuthEnvelope
export type IRefreshResponse = IAuthEnvelope
export type IForgetPasswordResponse = IAuthEnvelope
export type IValidateCodeResponse = IAuthEnvelope
export type IUpdatePasswordResponse = IAuthEnvelope<IAuthUserData>

export interface IApiError {
  detail: string | Array<{ loc: (string | number)[]; msg: string; type: string }>
}
