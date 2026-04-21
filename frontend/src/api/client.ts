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
      request("/api/verify-token", { method: "POST", body: { token } }),
    validateToken: (token: string) =>
      request("/api/validate-token", { method: "POST", body: { token } }),
  },

  users: {
    me: () => request("/api/me"),
    update: (formData: FormData) =>
      request("/api/me", { method: "PATCH", body: formData, isFormData: true }),
    search: (search: string) =>
      request(`/api/users/search?search=${encodeURIComponent(search)}`),
    get: (userId: string) => request(`/api/users/${userId}`),
  },

  friends: {
    getAll: () => request("/api/friends"),
    add: (userId: string) =>
      request(`/api/friends/${userId}`, { method: "POST" }),
    remove: (userId: string) =>
      request(`/api/friends/${userId}`, { method: "DELETE" }),
  },

  pending: {
    getAll: () => request("/api/pending"),
    accept: (userId: string) =>
      request(`/api/pending/${userId}`, { method: "PATCH" }),
    reject: (userId: string) =>
      request(`/api/pending/${userId}`, { method: "DELETE" }),
  },

  conversations: {
    getAll: () => request("/api/conversations"),
    delete: (userId: string) =>
      request(`/api/conversations/${userId}`, { method: "DELETE" }),
  },

  messages: {
    send: (userId: string, message: string, replyToId?: string) =>
      request(`/api/chat/${userId}/messages`, { method: "POST", body: { message, reply_to_id: replyToId } }),
    get: (userId: string, limit = 50, offset = 0) =>
      request(`/api/chat/${userId}/messages?limit=${limit}&offset=${offset}`),
    delete: (userId: string, messageId: string) =>
      request(`/api/chat/${userId}/messages/${messageId}`, { method: "DELETE" }),
    edit: (userId: string, messageId: string, message: string) =>
      request(`/api/chat/${userId}/messages/${messageId}`, { method: "PATCH", body: { message } }),
  },

  communities: {
      create: (formData: FormData) =>
        request("/api/communities", { method: "POST", body: formData, isFormData: true }),
      getAll: () => request("/api/communities"),
      get: (communityId: string) =>
        request(`/api/communities/${communityId}`),
      update: (communityId: string, formData: FormData) =>
        request(`/api/communities/${communityId}`, { method: "PATCH", body: formData, isFormData: true }),
      removeImage: (communityId: string) =>
        request(`/api/communities/${communityId}/image`, { method: "DELETE" }),
      join: (communityId: string) =>
        request(`/api/communities/${communityId}/join`, { method: "POST" }),
      leave: (communityId: string) =>
        request(`/api/communities/${communityId}`, { method: "DELETE" }),
      delete: (communityId: string) =>
        request(`/api/communities/${communityId}`, { method: "DELETE" }),
  },

  channels: {
    getAll: (communityId: string) =>
      request(`/api/communities/${communityId}/channels`),
    get: (communityId: string, channelId: string) =>
      request(`/api/communities/${communityId}/channels/${channelId}`),
    create: (communityId: string, channelName: string, categoryId?: string) =>
      request(`/api/communities/${communityId}/channels`, { method: "POST", body: { channel_name: channelName, category_id: categoryId || null } }),
    delete: (communityId: string, channelId: string) =>
      request(`/api/communities/${communityId}/channels/${channelId}`, { method: "DELETE" }),
    sendMessage: (communityId: string, channelId: string, message: string, replyToId?: string) =>
      request(`/api/communities/${communityId}/channels/${channelId}/messages`, { method: "POST", body: { message, reply_to_id: replyToId } }),
    getMessages: (communityId: string, channelId: string, limit = 50, offset = 0) =>
      request(`/api/communities/${communityId}/channels/${channelId}/messages?limit=${limit}&offset=${offset}`),
    deleteMessage: (communityId: string, channelId: string, messageId: string) =>
      request(`/api/communities/${communityId}/channels/${channelId}/messages/${messageId}`, { method: "DELETE" }),
    editMessage: (communityId: string, channelId: string, messageId: string, message: string) =>
      request(`/api/communities/${communityId}/channels/${channelId}/messages/${messageId}`, { method: "PATCH", body: { message } }),
  },

  categories: {
    getAll: (communityId: string) =>
      request(`/api/communities/${communityId}/categories`),
    create: (communityId: string, categoryName: string) =>
      request(`/api/communities/${communityId}/categories`, { method: "POST", body: { category_name: categoryName } }),
    delete: (communityId: string, categoryId: string) =>
      request(`/api/communities/${communityId}/categories/${categoryId}`, { method: "DELETE" }),
  },

  members: {
    getAll: (communityId: string) =>
      request(`/api/communities/${communityId}/members`),
    kick: (communityId: string, memberId: string, reason?: string) =>
      request(`/api/communities/${communityId}/members/${memberId}`, { method: "DELETE", body: { reason: reason || "No Reason" } }),
    toggleRole: (communityId: string, userId: string, roleId: string) =>
      request(`/api/communities/${communityId}/members/${userId}/roles/${roleId}`, { method: "PATCH" }),
  },

  permissions: {
     getAll: (communityId: string) =>
      request(`/api/communities/${communityId}/permissions`),
  },

  roles: {
    getAll: (communityId: string) =>
      request(`/api/communities/${communityId}/roles`),
    create: (communityId: string, name: string, color: string, permissions: string) =>
      request(`/api/communities/${communityId}/roles`, { method: "POST", body: { name, color, permissions } }),
    update: (communityId: string, roleId: string, name: string, color: string, permissions: string) =>
      request(`/api/communities/${communityId}/roles/${roleId}`, { method: "PATCH", body: { name, color, permissions } }),
    delete: (communityId: string, roleId: string) =>
      request(`/api/communities/${communityId}/roles/${roleId}`, { method: "DELETE" }),
  },

  bans: {
    getAll: (communityId: string) =>
      request(`/api/communities/${communityId}/bans`),
    ban: (communityId: string, userId: string, reason?: string) =>
      request(`/api/communities/${communityId}/bans/${userId}`, { method: "POST", body: { reason: reason || "No Reason" } }),
    unban: (communityId: string, userId: string) =>
      request(`/api/communities/${communityId}/bans/${userId}`, { method: "DELETE" }),
  },

  logs: {
    getAll: (communityId: string) =>
      request(`/api/communities/${communityId}/logs`),
  },
};