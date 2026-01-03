import {api} from "../api";

export const UserApi = {
  getUserById: (id: string) => api.get(`/v1/user/${id}`),
  getUsers: () => api.get("/v1/users"),
};
