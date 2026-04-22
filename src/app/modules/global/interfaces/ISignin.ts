export interface ISigninRequest {
  email: string
  password: string
}

export interface ISigninResponse {
  message: string,
  data: ISigninData
}

export interface ISigninData {
  user: {
    accessId: number;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    active: boolean;
    roles: string[];
  }
}