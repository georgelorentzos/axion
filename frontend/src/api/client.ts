const getApiUrl = () => window.GLOBAL_ENV.API_ENDPOINT;
const getToken = () => localStorage.getItem("token");

type RequestOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  isFormData?: boolean;
};

async function request<T = any>(
  path: string,
  options: RequestOptions = {}
): Promise<{ response: Response; data: T }> {
  const { method = "GET", body, headers = {}, isFormData = false } = options;
  const token = getToken();

  const defaultHeaders: Record<string, string> = {};
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }
  if (!isFormData) {
    defaultHeaders["Content-type"] = "application/json";
  }

  const response = await fetch(`${getApiUrl()}${path}`, {
    method,
    headers: { ...defaultHeaders, ...headers },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  return { response, data };
}

export const api = {
  auth: {
    login: (email: string) =>
      request("/api/auth", { method: "POST", body: { email } }),
    verifyToken: (token: string) =>
      request("/api/verify-token", { method: "POST", body: { token, type: "Auth" } }),
    validateToken: (token: string) =>
      request("/api/validate-token", { method: "POST", body: { token } }),
  },

  users: {
    me: () => request("/api/me"),
    search: (search: string) =>
      request(`/api/users/search?search=${encodeURIComponent(search)}`),
    profile: (userId: string) => request(`/api/users/${userId}`),
  },

  friends: {
    sendRequest: (requesterId: string, addresseeId: string) =>
      request("/api/ally", { method: "POST", body: { requester_id: requesterId, addressee_id: addresseeId } }),
    cancelRequest: (requesterId: string, addresseeId: string) =>
      request("/api/ally/cancel", { method: "DELETE", body: { requester_id: requesterId, addressee_id: addresseeId } }),
    rejectRequest: (requesterId: string, addresseeId: string) =>
      request("/api/ally/reject", { method: "DELETE", body: { requester_id: requesterId, addressee_id: addresseeId } }),
    acceptRequest: (requesterId: string, addresseeId: string) =>
      request("/api/ally/accept", { method: "POST", body: { requester_id: requesterId, addressee_id: addresseeId } }),
    remove: (requesterId: string, addresseeId: string) =>
      request("/api/ally/remove", { method: "DELETE", body: { requester_id: requesterId, addressee_id: addresseeId } }),
    myRequests: () => request("/api/my/ally/requests"),
    pending: () => request("/api/my/pending"),
    all: () => request("/api/my/friends/all"),
    online: () => request("/api/my/friends/online"),
  },

  directMessages: {
    send: (recipientId: string, message: string) =>
      request(`/api/send/message/${recipientId}`, { method: "POST", body: { message } }),
    get: (userId: string, limit = 50, offset = 0) =>
      request(`/api/messages/${userId}?limit=${limit}&offset=${offset}`),
    conversations: () => request("/api/my/conversations"),
    deleteConversation: (userId: string) =>
      request(`/api/conversation/${userId}`, { method: "DELETE" }),
  },

  channelMessages: {
    send: (communityId: string, channelId: string, message: string) =>
      request(`/api/community/${communityId}/channels/${channelId}/messages`, { method: "POST", body: { message } }),
    get: (communityId: string, channelId: string, limit = 50, offset = 0) =>
      request(`/api/community/${communityId}/channels/${channelId}/messages?limit=${limit}&offset=${offset}`),
  },

  communities: {
    create: (formData: FormData) =>
      request("/api/community/create", { method: "POST", body: formData, isFormData: true }),
    mine: () => request("/api/my/communities"),
    get: (communityId: string) => request(`/api/community/${communityId}`),
    update: (communityId: string, formData: FormData) =>
      request(`/api/community/${communityId}`, { method: "PATCH", body: formData, isFormData: true }),
    join: (communityId: string) =>
      request(`/api/community/${communityId}/join`, { method: "PATCH" }),
    leave: (communityId: string) =>
      request(`/api/community/${communityId}/leave`, { method: "DELETE" }),
    delete: (communityId: string, communityName: string) =>
      request(`/api/community/${communityId}?community_name=${encodeURIComponent(communityName)}`, { method: "DELETE" }),
  },

  members: {
    get: (communityId: string) => request(`/api/community/${communityId}/members`),
    kick: (communityId: string, memberId: string, reason?: string) =>
      request(`/api/community/${communityId}/members/${memberId}/kick`, { method: "DELETE", body: { reason: reason || "No Reason" } }),
    ban: (communityId: string, memberId: string, reason?: string) =>
      request(`/api/community/${communityId}/members/${memberId}/ban`, { method: "DELETE", body: { reason: reason || "No Reason" } }),
    toggleRole: (communityId: string, userId: string, roleId: string) =>
      request(`/api/community/${communityId}/members/${userId}/roles/${roleId}`, { method: "PATCH" }),
    myPermissions: (communityId: string) =>
      request(`/api/community/${communityId}/permissions`),
  },

  roles: {
    get: (communityId: string) => request(`/api/community/${communityId}/roles`),
    create: (communityId: string, name: string, permissions: string) =>
      request(`/api/community/${communityId}/roles`, { method: "POST", body: { name, permissions } }),
    update: (communityId: string, roleId: string, name: string, permissions: string) =>
      request(`/api/community/${communityId}/roles/${roleId}`, { method: "PATCH", body: { name, permissions } }),
    delete: (communityId: string, roleId: string) =>
      request(`/api/community/${communityId}/roles/${roleId}`, { method: "DELETE" }),
  },

  bans: {
    get: (communityId: string) => request(`/api/community/${communityId}/bans`),
    unban: (communityId: string, userId: string) =>
      request(`/api/community/${communityId}/bans/${userId}`, { method: "DELETE" }),
  },

  logs: {
    get: (communityId: string) => request(`/api/community/${communityId}/logs`),
  },

  categories: {
    create: (communityId: string, categoryName: string) =>
      request(`/api/community/${communityId}/categories`, { method: "POST", body: { category_name: categoryName } }),
    delete: (communityId: string, categoryId: string) =>
      request(`/api/community/${communityId}/categories/${categoryId}`, { method: "DELETE" }),
    get: (communityId: string) =>
      request(`/api/community/${communityId}/categories`, { method: "GET" }),
  },

  channels: {
      get: (communityId: string) =>
        request(`/api/community/${communityId}/channels`, { method: "GET" }),
      getOne: (communityId: string, channelId: string) =>
        request(`/api/community/${communityId}/channels/${channelId}`, { method: "GET" }),
      create: (communityId: string, channelName: string, categoryId?: string) =>
        request(`/api/community/${communityId}/channels`, { method: "POST", body: { channel_name: channelName, category_id: categoryId || null } }),
      delete: (communityId: string, channelId: string) =>
        request(`/api/community/${communityId}/channels/${channelId}`, { method: "DELETE" }),
  },

};
