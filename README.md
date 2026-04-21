# Axion

**Axion** is a full-stack, real-time communication platform inspired by Discord. It enables users to connect through direct messaging and community-based channels, with rich features including live online presence, role-based permissions, message replies, moderation tools, and invite links. Axion is built for performance and scalability, using a modern technology stack with WebSocket-driven real-time updates throughout the entire application.

---

## Key Features

### Direct Messaging
| Feature | Description |
|---|---|
| Send & Receive | Real-time direct messages between users with instant WebSocket delivery. |
| Reply Threads | Users can reply to specific messages, with the original message previewed inline. |
| Edit & Delete | Message owners can edit or delete their messages, with updates reflected live for both parties. |
| Conversation List | Persistent conversation sidebar showing the latest message and online status of each contact. |
| Unread Indicators | Unread message badges notify users of new messages from contacts. |
| Hidden Conversations | Users can hide conversations without deleting the underlying message history. |

### Communities
| Feature | Description |
|---|---|
| Create & Manage | Users can create communities with a name and image, and manage all settings as owner. |
| Channels | Communities support multiple text channels, organized optionally into categories. |
| Invite Links | Owners can generate shareable invite links. Invite links render as rich cards inside messages. |
| Member Management | View all members, assign or remove roles, kick members, and manage bans with reasons. |
| Audit Logs | A full activity log tracks moderation actions such as kicks, bans, and channel changes. |

### Roles & Permissions
| Feature | Description |
|---|---|
| Custom Roles | Community owners can create roles with custom names and colors. |
| Granular Permissions | Each role carries a configurable set of permissions such as Administrator, Manage Channels, Manage Members, and more. |
| Role Colors | Role colors are displayed on member usernames inside community channels for visual hierarchy. |
| Role Assignment | Roles can be toggled on or off per member from the member management panel. |

### Real-Time Presence
| Feature | Description |
|---|---|
| Online Status | Users see live online/offline status of friends and community members. |
| Last Seen | Offline users display their last seen timestamp. |
| Live Updates | All presence changes are pushed instantly via WebSocket without page refresh. |

### Friend System
| Feature | Description |
|---|---|
| Friend Requests | Users can send, accept, or reject friend requests. |
| Online Friends | A dedicated tab showing only currently online friends. |
| All Friends | A tab displaying all friends regardless of status, with online/offline indicators for each. |
| Pending Requests | Incoming and outgoing pending requests are listed separately. |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Go (Golang) — high-performance HTTP server using the standard `net/http` package |
| Database | PostgreSQL — relational database with full referential integrity |
| Real-Time | WebSockets via Gorilla WebSocket — bidirectional push communication |
| Authentication | JWT (JSON Web Tokens) via golang-jwt |
| Frontend | React with TypeScript — component-based UI |
| Routing | React Router — client-side navigation |
| Styling | Tailwind CSS — utility-first responsive design |
| Runtime | Bun — fast JavaScript runtime and package manager |
| Containerization | Docker & Docker Compose — reproducible multi-service deployment |