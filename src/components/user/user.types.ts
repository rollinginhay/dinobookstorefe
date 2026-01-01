export type Role = {
  id: string;
  name: string;
  enabled?: boolean;
};

export type User = {
  id: string;
  email: string;
  username: string;
  password?: string;
  personName: string;
  phoneNumber: string;
  address: string;
  enabled: boolean;
  isOauth2User: boolean;
  oauth2Id?: string;
  note?: string;
  roles: Role[];
  createdAt?: string;
  updatedAt?: string;
};





