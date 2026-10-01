# Dwaar Frontend

A location-based social platform frontend built with React, featuring real-time messaging, location-aware rooms, and group conversations.

## 🚀 Tech Stack

- **React 18.3.1** - UI library
- **Vite 5.4.0** - Build tool and dev server
- **React Router DOM 6.26.0** - Client-side routing
- **Socket.IO Client 4.7.5** - Real-time WebSocket communication
- **JavaScript (ES6+)** - Language

## ✨ Features

- **Authentication** - User registration, login, token-based auth with refresh tokens
- **Location-based Exploration** - Find nearby buildings and rooms using geospatial queries
- **Real-time Messaging** - Private direct messages with typing indicators
- **Group Conversations** - Create and manage private groups with multiple members
- **Location-based Rooms** - Join rooms based on physical proximity
- **File Upload** - Upload images, videos, and documents via Cloudinary
- **User Management** - Profile editing, location management, account deletion
- **Real-time Presence** - See online users and connection status
- **Status Monitoring** - Backend health checks and API documentation access

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API server running (default: http://localhost:5000)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dwaar-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
```

4. Edit `.env` and set your backend API URL:
```env
VITE_API_URL=http://localhost:5000
```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```
The app will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
```
Build output will be in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000` |

### Vite Proxy Configuration

In development mode, Vite proxies API and Socket.IO requests to the backend:
- `/api/*` → Backend API endpoints
- `/health` → Backend health check
- `/docs` → API documentation (Swagger/OpenAPI)
- `/socket.io` → Socket.IO WebSocket connection

The backend's `CLIENT_URL` must be set to `http://localhost:3000` for CORS and Socket.IO to work correctly in development.

## 📁 Project Structure

```
dwaar-frontend/
├── src/
│   ├── main.jsx           # Application entry point
│   ├── App.jsx            # Root component with routing
│   ├── api.js             # API client and authentication
│   ├── context.jsx        # React Context providers (Auth, Socket, Toast)
│   ├── components.jsx     # Reusable UI components
│   ├── styles.css         # Global styles
│   └── pages/             # Page components
│       ├── Login.jsx      # Login page
│       ├── Register.jsx   # Registration page
│       ├── Profile.jsx    # User profile management
│       ├── Explore.jsx    # Location-based exploration
│       ├── Rooms.jsx      # Location-based rooms
│       ├── Groups.jsx     # Group conversations
│       ├── Messages.jsx   # Private messages
│       ├── Users.jsx      # User directory
│       ├── Upload.jsx     # File upload interface
│       └── Status.jsx     # System status monitoring
├── public/                # Static assets
├── dist/                  # Production build output
├── vite.config.js         # Vite configuration
├── package.json           # Dependencies and scripts
└── .env.example           # Environment template
```

## 🌐 API Endpoints

### Authentication

#### POST `/api/users/`
Register a new user account.
- **Body**: `{ name, email, phone, password }`
- **Response**: User object with tokens
- **Auth**: Not required

#### POST `/api/users/login`
Authenticate user and receive tokens.
- **Body**: `{ email, phone, password }`
- **Response**: `{ token, refreshToken, user }`
- **Auth**: Not required

#### POST `/api/users/check-phone`
Check if a phone number is already registered.
- **Body**: `{ phone }`
- **Response**: `{ exists: boolean }`
- **Auth**: Not required

#### POST `/api/users/refresh-token`
Refresh access token using refresh token.
- **Body**: `{ refreshToken }`
- **Response**: `{ token }`
- **Auth**: Not required

#### POST `/api/users/logout`
Invalidate current session.
- **Auth**: Required

### User Management

#### GET `/api/users/me`
Get current user profile.
- **Auth**: Required

#### GET `/api/users/`
Get list of all users.
- **Auth**: Required

#### GET `/api/users/:id`
Get specific user profile.
- **Auth**: Required

#### PUT `/api/users/:id`
Update user profile.
- **Body**: `{ name, email, ... }`
- **Auth**: Required

#### DELETE `/api/users/:id`
Delete user account.
- **Auth**: Required

#### GET `/api/users/get-location`
Get user's saved location.
- **Auth**: Required

#### POST `/api/users/add-location`
Save user's location.
- **Body**: `{ latitude, longitude, city, region, country }`
- **Auth**: Required

#### POST `/api/users/nearby-buildings`
Find buildings near user's saved location.
- **Body**: `{ radius }` (in meters)
- **Auth**: Required

#### POST `/api/users/join-room`
Join a location-based room.
- **Body**: `{ roomId }`
- **Auth**: Required

#### GET `/api/users/joined-rooms`
Get list of rooms user has joined.
- **Auth**: Required

### Spatial/Location

#### POST `/api/spatial/nearby`
Find buildings near specific coordinates.
- **Body**: `{ lat, lon, radius }`
- **Auth**: Not required

#### POST `/api/spatial/nearby-rooms`
Find rooms near specific coordinates.
- **Body**: `{ lat, lon, radius }`
- **Auth**: Not required

### Groups

#### POST `/api/groups/`
Create a new group.
- **Body**: `{ name, description, category, subCategory, adminId, memberIds }`
- **Auth**: Required

#### GET `/api/groups/user/:userId`
Get groups for a specific user.
- **Auth**: Required

#### POST `/api/groups/:groupId/members`
Add a member to a group.
- **Body**: `{ userId }`
- **Auth**: Required

#### DELETE `/api/groups/:groupId/members/:userId`
Remove a member from a group.
- **Auth**: Required

#### GET `/api/groups/:groupId/messages`
Get messages for a group.
- **Auth**: Required

#### POST `/api/groups/:groupId/join`
Join a group by ID.
- **Body**: `{ userId }`
- **Auth**: Required

### Messages

#### GET `/api/messages/rooms/:roomId`
Get messages for a location-based room.
- **Auth**: Required

#### GET `/api/messages/private/:userId`
Get private messages with a specific user.
- **Headers**: `X-User-Id: currentUserId`
- **Auth**: Required

#### GET `/api/conversations/:userId`
Get list of conversations for a user.
- **Auth**: Required

### Upload

#### POST `/api/upload/`
Upload a file (image, video, document).
- **Body**: FormData with `file` field
- **Response**: `{ file: { url, public_id, resource_type, format, bytes } }`
- **Auth**: Not required

### Health

#### GET `/health`
Check backend server health.
- **Response**: `{ status, uptime, timestamp }`
- **Auth**: Not required

## 🔌 Socket.IO Events

### Client → Server Events

#### `register_user`
Register user's presence on connection.
- **Data**: `{ userId }`

#### `join_group`
Join a specific group room.
- **Data**: `{ groupId }`

#### `leave_group`
Leave a specific group room.
- **Data**: `{ groupId }`

#### `join_groups`
Join multiple group rooms at once.
- **Data**: `{ groupIds: [] }`

#### `send_group_message`
Send a message to a group.
- **Data**: `{ groupId, message, type, attachment }`

#### `send_private_message`
Send a private message to a user.
- **Data**: `{ recipientId, message, type, attachment }`

#### `group_typing`
Broadcast typing status in a group.
- **Data**: `{ groupId, isTyping }`

#### `private_typing`
Broadcast typing status in private chat.
- **Data**: `{ recipientId, isTyping }`

### Server → Client Events

#### `online_users`
List of currently online users.
- **Data**: Array of user IDs or user objects

#### `user_offline`
Notification when a user goes offline.
- **Data**: User ID

#### `receive_group_message`
New message in a group.
- **Data**: Message object

#### `group_typing`
Typing indicator in a group.
- **Data**: `{ groupId, userId, isTyping }`

#### `receive_private_message`
New private message.
- **Data**: Message object

#### `private_typing`
Typing indicator in private chat.
- **Data**: `{ senderId, isTyping }`

#### `private_message_error`
Error sending private message.
- **Data**: Error object

## 📄 Pages Overview

### Login (`/login`)
- Email and phone number authentication
- Password-based login
- Redirects to profile on success

### Register (`/register`)
- User registration with name, email, phone, and password
- Real-time phone number availability check
- Auto-login after successful registration

### Profile (`/`)
- View and edit user profile (name, email)
- Manage saved location (coordinates, city, region, country)
- Use device geolocation to auto-detect location
- Delete account functionality

### Explore (`/explore`)
- Find buildings near saved location
- Search buildings/rooms by coordinates
- Use device GPS for current location
- Join nearby rooms
- View results on OpenStreetMap

### Rooms (`/rooms`)
- View joined location-based rooms
- Join rooms by ID
- Read room messages (read-only)
- View room details (name, category, member count)

### Groups (`/groups`)
- Create new groups with multiple members
- Join groups by ID
- Manage group members (add/remove)
- Real-time group messaging
- Typing indicators
- Admin controls

### Messages (`/messages`)
- View conversation list
- Start new conversations
- Real-time private messaging
- Typing indicators
- Online status indicators
- File attachments

### Users (`/users`)
- View all registered users
- See online status
- User profile details

### Upload (`/upload`)
- Upload files to Cloudinary
- View uploaded files
- Copy shareable links
- Support for images, videos, documents

### Status (`/status`)
- Backend health check
- Server uptime and timestamp
- Socket.IO connection status
- Online user count
- Link to API documentation

## 🔐 Authentication Flow

1. **Login/Register**: User credentials sent to backend
2. **Token Storage**: Access token and refresh token stored in localStorage
3. **API Requests**: Access token included in `Authorization: Bearer <token>` header
4. **Token Refresh**: On 401 response, automatic refresh using refresh token
5. **Auth Loss**: If refresh fails, tokens cleared and user redirected to login
6. **Socket Auth**: Token sent in Socket.IO connection auth object

## 🎨 UI Components

### Core Components (components.jsx)

- **Field** - Form field with label
- **Card** - Container with optional title and actions
- **PageHead** - Page title and subtitle
- **Empty** - Empty state message
- **ChatThread** - Reusable chat interface with message list, composer, file upload
- **Attachment** - Renders images, videos, or document links
- **useAction** - Hook for async actions with loading state and error handling
- **useUsers** - Hook for loading user directory with name lookup
- **norm** - Normalizes message shapes from different sources
- **fmtTime** - Formats timestamps

### Context Providers (context.jsx)

- **AuthProvider** - Authentication state, login/logout, user data
- **SocketProvider** - Socket.IO connection, online users, connection status
- **ToastProvider** - Toast notifications for success/error messages

## 🚢 Deployment

### Production Build

1. Set production API URL in `.env`:
```env
VITE_API_URL=https://your-backend-url.com
```

2. Build the application:
```bash
npm run build
```

3. Deploy the `dist/` directory to your hosting service:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages
- Any static hosting service

### Environment Setup for Production

- Ensure backend CORS allows your production domain
- Set backend `CLIENT_URL` to your production frontend URL
- Configure Socket.IO to accept connections from your domain

## 🐛 Troubleshooting

### CORS Errors
- Verify backend CORS configuration includes your frontend URL
- Check `VITE_API_URL` is correctly set

### Socket.IO Connection Issues
- Ensure backend Socket.IO is running
- Check firewall/proxy settings for WebSocket connections
- Verify backend `CLIENT_URL` matches frontend URL

### Token Refresh Failing
- Check refresh token is stored in localStorage
- Verify backend refresh token endpoint is working
- Ensure token hasn't expired on backend

### File Upload Failing
- Verify Cloudinary is configured on backend
- Check file size limits
- Ensure CORS allows upload requests

## 📝 License

[Add your license here]

## 🤝 Contributing

[Add contribution guidelines here]

## 📞 Support

For issues and questions, please contact [support contact or create an issue in the repository].
# dwaar-web
