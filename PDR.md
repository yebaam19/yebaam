# PDR — Yebaam Backend Migration to InsForge

## Overview

This document captures all the backend logic from the current NestJS API (`api-yeebaam-backen-service-ecr`) to be re-implemented on InsForge.

- **Current stack (legacy):** NestJS 11 + TypeScript, PostgreSQL (TypeORM), MongoDB (Mongoose), Redis, Socket.IO, Bull queues, AWS S3/CloudFront/IVS/SES, Twilio
- **Target stack:**
  - **Backend / DB / Auth / Storage / Realtime / Edge Functions / Cron** → InsForge
  - **Email** → [Resend](https://resend.com) (called from edge functions; API key stored as InsForge secret `RESEND_API_KEY`)
  - **Live streaming** → deferred (future: Livepeer or Mux if needed)
  - **Push notifications** → deferred (future: OneSignal if needed)
- **Architecture pattern:** Postgres-first with RLS; business logic in edge functions only when CRUD + RLS isn't enough

### Removed from scope
- ❌ AWS S3 / CloudFront / IVS / SES — replaced by InsForge storage + Resend
- ❌ MongoDB — everything lives in InsForge Postgres
- ❌ Redis / Bull queues — replaced by InsForge cron schedules + edge functions
- ❌ Socket.IO — replaced by InsForge realtime table subscriptions
- ❌ Twilio / SMS / phone OTP — email OTP via InsForge auth + Resend is sufficient
- ❌ Multi-provider email abstraction (SendGrid/Mailtrap/Nodemailer) — Resend only
- ❌ Server-side E2E chat encryption — rely on TLS + RLS
- ❌ Custom JWT / bcrypt / refresh tokens — use InsForge auth (built-in)

### Realtime event mapping
Instead of Socket.IO gateways, clients subscribe to InsForge table changes:
| Legacy gateway | InsForge replacement |
|---|---|
| ChatGateway (`message:new`) | subscribe to `messages` where `conversation_id = X` |
| NotificationGateway | subscribe to `notifications` where `recipient_id = auth.uid()` |
| CommentGateway | subscribe to `comments` where `post_id = X` |
| FriendshipsGateway | subscribe to `friendships` where `recipient_id = auth.uid()` |
| PostGateway | subscribe to `posts` feed (client-side filter) |

### Background jobs (replacing Bull queues)
| Legacy queue | InsForge replacement |
|---|---|
| `email-queue` | Edge function `send-email` → Resend API (called inline or via trigger) |
| `notification-queue` | DB trigger inserts into `notifications` table; realtime delivers |
| `media-queue` | Deferred; InsForge storage handles basic delivery |
| Story 24h expiry | Cron schedule → edge function `story-cleanup` (runs hourly) |

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User Profile](#2-user-profile)
3. [Posts / Feed](#3-posts--feed)
4. [Stories](#4-stories)
5. [Comments](#5-comments)
6. [Reactions](#6-reactions)
7. [Friendships](#7-friendships)
8. [Notifications](#8-notifications)
9. [Chat / Messaging](#9-chat--messaging)
10. [Blogs](#10-blogs)
11. [Businesses](#11-businesses)
12. [Pages](#12-pages)
13. [Groups](#13-groups)
14. [Clubs](#14-clubs)
15. [Professional Profile](#15-professional-profile)
16. [Professional Services](#16-professional-services)
17. [Live Streaming](#17-live-streaming)
18. [Search](#18-search)
19. [Cities / Location Data](#19-cities--location-data)
20. [Media / File Upload](#20-media--file-upload)
21. [Email Service](#21-email-service)
22. [Job Queues](#22-job-queues)
23. [Real-time / WebSockets](#23-real-time--websockets)
24. [Health Checks](#24-health-checks)
25. [Database Schema Reference](#25-database-schema-reference)
26. [Environment Variables Reference](#26-environment-variables-reference)

---

## 1. Authentication

### Purpose
User registration with email verification (OTP), login, JWT token management, password reset.

### Data Model (PostgreSQL → users table)
```
id              UUID (PK)
email           VARCHAR unique
username        VARCHAR unique nullable
firstName       VARCHAR
secondName      VARCHAR nullable
lastName        VARCHAR
secondLastName  VARCHAR nullable
password        VARCHAR (bcrypt hashed)
status          ENUM: PENDING | ACTIVE | SUSPENDED | BLOCKED
emailVerified   BOOLEAN default false
profileCompleted BOOLEAN default false
birthDate       DATE nullable
gender          VARCHAR nullable
country         VARCHAR nullable
state           VARCHAR nullable
city            VARCHAR nullable
acceptedTerms   BOOLEAN
otpCode         VARCHAR nullable
otpExpiresAt    TIMESTAMP nullable
refreshToken    VARCHAR nullable
resetPasswordToken VARCHAR nullable
resetPasswordExpires TIMESTAMP nullable
createdAt       TIMESTAMP
updatedAt       TIMESTAMP
lastLoginAt     TIMESTAMP nullable
```

### Business Logic

**Registration flow:**
1. Validate email uniqueness
2. Hash password with bcrypt (10 rounds)
3. Create user with status=PENDING
4. Generate 6-digit OTP, expires in 10 minutes
5. Send OTP via email
6. Return success message

**Email verification flow:**
1. Find user by email
2. Validate OTP matches and is not expired
3. Set status=ACTIVE, emailVerified=true
4. Clear otpCode and otpExpiresAt

**Resend OTP:**
1. Find user by email, must be PENDING
2. Generate new OTP, reset expiry to 10 minutes
3. Send via email

**Login flow:**
1. Find user by email
2. Validate user status is ACTIVE
3. Compare password with bcrypt
4. Generate JWT access token (expires 24h), payload: { sub: userId }
5. Store refresh token in DB
6. Update lastLoginAt
7. Return access token + user data

**Password reset flow:**
1. Generate reset token, store with 1-hour expiry
2. Send reset link via email
3. On reset: validate token not expired, hash new password, clear token

**JWT strategy:**
- Algorithm: HS256
- Secret: `JWT_SECRET` env var
- Expiration: `JWT_EXPIRES_IN` (default 24h)
- Guard: validates token on every protected route, injects user into request

### Endpoints
```
POST   /api/auth/register          Register new user
POST   /api/auth/verify-email      Verify email with OTP
POST   /api/auth/resend-otp        Resend OTP code
POST   /api/auth/login             Login → returns JWT
GET    /api/auth/me                Get current authenticated user (protected)
POST   /api/auth/forgot-password   Send password reset email
POST   /api/auth/reset-password    Reset password with token
```

---

## 2. User Profile

### Purpose
Extended user profile beyond auth — photos, bio, work, education, interests, privacy settings, albums, featured media.

### Data Model (MongoDB → user_profiles collection)
```
_id                  = userId (from PostgreSQL)
username             string
firstName            string
middleName           string nullable
lastName             string
secondLastName       string nullable
displayName          string nullable
bio                  string nullable
website              string nullable
tagline              string nullable
birthDate            date nullable
gender               string nullable
pronouns             string nullable
country, state, city string nullable
coordinates          { lat, lng } nullable
hometown             string nullable
birthCity            string nullable
residenceCity        string nullable
phoneNumber          string nullable
secondaryEmail       string nullable
avatarUrl            string nullable
coverPhotoUrl        string nullable
idDocumentUrl        string nullable
profileVideoUrl      string nullable
currentJob           string nullable
currentCompany       string nullable
currentSchool        string nullable
relationshipStatus   string nullable
languages            string[]
interests            string[]
profileVisibility    'public' | 'friends' | 'private'
showEmail            boolean
whoCanPost           'everyone' | 'friends' | 'nobody'
notificationSettings { likes, comments, friendRequests, messages, ... }
friendsCount         number default 0
followersCount       number default 0
postsCount           number default 0
videosCount          number default 0
isActive             boolean default true
isVerified           boolean default false
isCelebrity          boolean default false
lastActiveAt         timestamp
createdAt, updatedAt timestamps
```

**Related collections:**
- `profile_albums` — { userId, name, description, coverPhoto, photosCount }
- `profile_photos` — { userId, albumId, url, s3Key, caption, createdAt }
- `profile_videos` — { userId, url, s3Key, title, thumbnail, createdAt }
- `user_about` — { userId, overview, work, education, places, contact, family }
- `user_work_education` — { userId, type, title, organization, startDate, endDate, current }
- `user_interests_hobbies` — { userId, categories: [{ name, items: [] }] }
- `user_featured_photos` — { userId, photos: [{ url, s3Key }] }
- `user_life_events` — { userId, title, date, category, description, media }
- `user_places_lived` — { userId, city, state, country, from, to, current }
- `user_privacy_settings` — full privacy config per feature
- `user_media_gallery` — { userId, media: [{ url, type, s3Key }] }
- `user_story_highlights` — { userId, highlights: [{ title, coverImage, stories: [] }] }

### Business Logic
- Profile created automatically on first login or profile completion step
- Avatar and cover photo stored in S3, URL stored in profile
- Privacy settings control who can view each section
- Stats (friendsCount, postsCount, etc.) updated via events when actions happen

### Endpoints
```
GET    /api/users/:userId          Get user profile (public parts based on privacy)
GET    /api/users/me               Get current user full profile (protected)
PATCH  /api/users/:userId          Update profile fields (protected, own profile only)
GET    /api/users/:userId/albums   Get user albums
GET    /api/users/:userId/photos   Get user photos
GET    /api/users/:userId/videos   Get user videos
POST   /api/badges                 Award badge to user (admin)
GET    /api/badges/:userId         Get user badges
```

---

## 3. Posts / Feed

### Purpose
Create, read, update, delete posts. Support text, images, videos, reels. Feed/timeline with privacy filtering.

### Data Model (MongoDB → posts collection)
```
_id              ObjectId
author           { id, username, firstName, lastName, avatar }
content          string nullable
backgroundColor  string nullable
mediaFiles       [{
  s3Key          string
  url            string
  type           'image' | 'video'
  width, height  number nullable
  size           number nullable
  duration       number nullable (video)
  mimeType       string nullable
  uploadedAt     timestamp
}]
reactionsCount   Map<reactionType, count>
privacy          'public' | 'private' | 'friends'
blogId           ObjectId nullable (if posted to blog)
pageId           ObjectId nullable (if posted to page)
isReel           boolean default false
aspectRatio      'vertical' | 'horizontal' | 'square' nullable
createdAt        timestamp
updatedAt        timestamp

Indexes:
- author.id + createdAt
- privacy + createdAt
- blogId + createdAt
- pageId + createdAt
```

### Business Logic
- **Create post:** validate content or mediaFiles exists, attach author from JWT, save
- **Generate upload URLs:** generate S3 presigned URLs for each file before upload, return keys
- **Timeline/Feed:** query public posts + friends' posts, paginated by cursor (createdAt), sorted descending
- **Privacy filtering:** public posts visible to all, friends posts only to confirmed friends, private only to owner
- **Media upload flow:** client requests presigned URLs → uploads directly to S3 → then calls create post with s3Keys
- **Delete post:** validate ownership, delete from DB, delete S3 files
- **Statistics:** aggregate reactions, comments count, views for a post

### Endpoints
```
POST   /api/create-post                       Create post (protected)
POST   /api/create-post/generate-upload-urls  Get S3 presigned URLs for media
GET    /api/my-post                           Get current user's posts (protected)
GET    /api/my-post/:id                       Get specific post by ID
GET    /api/get-post                          Get public posts (paginated)
GET    /api/posts/timeline                    Feed timeline (protected)
PATCH  /api/post/:id                          Update post (protected, owner only)
DELETE /api/post/delete-post/:id              Delete post (protected, owner only)
GET    /api/posts/:id/statistics              Get post engagement stats
POST   /api/post/:id/upload-url              Get media upload URL for existing post
GET    /api/pages/:pageId/posts              Get posts for a page
GET    /api/post/user/:userId                Get posts by a specific user
```

---

## 4. Stories

### Purpose
Ephemeral content (images/videos) that auto-expires after 24 hours, similar to Instagram Stories.

### Data Model (MongoDB → stories collection)
```
_id        ObjectId
author     userId
mediaUrl   string
s3Key      string
type       'image' | 'video'
content    string nullable (text overlay)
backgroundColor string nullable
viewers    [userId]
viewCount  number default 0
privacy    'public' | 'friends'
expiresAt  timestamp (createdAt + 24h)
createdAt  timestamp
```

### Business Logic
- Stories auto-expire 24h after creation (TTL index on `expiresAt`)
- Viewer list tracked — each view appended once per user
- Feed shows stories from friends/followed users, grouped by author
- Author can see who viewed their story

### Endpoints
```
POST   /api/stories           Create story (protected)
GET    /api/stories           Get stories feed (friends' active stories, protected)
GET    /api/stories/:userId   Get specific user's active stories
POST   /api/stories/:id/view  Mark story as viewed (protected)
DELETE /api/stories/:id       Delete story (protected, owner only)
```

---

## 5. Comments

### Purpose
Comments on posts with nested replies support. Real-time updates via WebSocket.

### Data Model (MongoDB → comments collection)
```
_id              ObjectId
postId           ObjectId
parentCommentId  ObjectId nullable (for nested replies)
author           { id, username, avatar }
content          string
mentions         [userId]
likes            number default 0
repliesCount     number default 0
isEdited         boolean default false
editedAt         timestamp nullable
createdAt        timestamp
updatedAt        timestamp
```

### Business Logic
- Comments linked to postId; replies linked to parentCommentId
- Nested depth: max 2 levels (comment → reply)
- Mention users with @username, triggers notification
- Real-time: new comments emitted via WebSocket to post subscribers
- Author or post owner can delete any comment

### Endpoints
```
POST   /api/posts/:postId/comments    Create comment (protected)
GET    /api/posts/:postId/comments    Get comments for post (paginated)
PATCH  /api/comments/:id              Update comment (protected, owner only)
DELETE /api/comments/:id              Delete comment (protected, owner or post owner)
```

---

## 6. Reactions

### Purpose
Emoji reactions on posts and comments (like, love, haha, wow, sad, angry).

### Data Model (MongoDB → reactions collection)
```
_id        ObjectId
type       'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
userId     string
postId     ObjectId nullable
commentId  ObjectId nullable
createdAt  timestamp

Unique index: userId + postId (one reaction per user per post)
```

### Business Logic
- One reaction per user per post (upsert by type or replace)
- On create/update: increment/decrement `reactionsCount` map on the post
- On delete: decrement count on post
- Triggers notification to post author

### Endpoints
```
POST   /api/posts/:postId/reactions              Add/update reaction (protected)
DELETE /api/posts/:postId/reactions/:reactionId  Remove reaction (protected)
GET    /api/posts/:postId/reactions              Get all reactions with counts
```

---

## 7. Friendships

### Purpose
Friend request system — send, accept, decline, remove, block. Real-time updates.

### Data Model (MongoDB → friendships collection)
```
_id         ObjectId
requester   userId
recipient   userId
status      'pending' | 'accepted' | 'blocked'
createdAt   timestamp
acceptedAt  timestamp nullable

Indexes:
- requester + recipient (unique)
- recipient + status (for pending requests query)
```

### Business Logic
- Send request: create doc with status=pending, notify recipient
- Accept: set status=accepted, acceptedAt=now, increment friendsCount for both
- Decline: delete the request document
- Remove friend: delete accepted friendship, decrement friendsCount for both
- Block: set status=blocked, blocked user cannot see blocker's content or send requests
- Suggested friends: users with mutual friends or shared interests (not yet friends)
- Real-time: friend request/accept emitted via WebSocket

### Endpoints
```
POST   /api/users/:userId/friend-request   Send friend request (protected)
PATCH  /api/friend-requests/:id/accept     Accept friend request (protected)
PATCH  /api/friend-requests/:id/decline    Decline friend request (protected)
DELETE /api/friends/:userId               Remove friend (protected)
POST   /api/users/:userId/block            Block user (protected)
GET    /api/users/:userId/friends          Get friends list
GET    /api/friends/requests               Get pending friend requests (protected)
GET    /api/friends/suggestions            Get friend suggestions (protected)
```

---

## 8. Notifications

### Purpose
In-app notifications for all social interactions. Real-time delivery via WebSocket.

### Data Model (MongoDB → notifications collection)
```
_id       ObjectId
type      'like' | 'comment' | 'follow' | 'message' | 'mention' | 'friend_request' | 'friend_accept'
recipient userId
actor     { id, username, avatar }
related   { type: 'post'|'comment'|'story', id: ObjectId } nullable
message   string
isRead    boolean default false
readAt    timestamp nullable
createdAt timestamp

Index: recipient + isRead + createdAt
```

### Business Logic
- Notifications created by event handlers when actions occur (reaction, comment, friend request, etc.)
- Real-time: emitted to recipient's WebSocket room on creation
- Batch mark-as-read supported
- Unread count returned on GET

### Endpoints
```
GET    /api/notifications              Get user's notifications (protected, paginated)
PATCH  /api/notifications/:id/read     Mark single notification as read (protected)
PATCH  /api/notifications/read-all     Mark all as read (protected)
DELETE /api/notifications/:id          Delete notification (protected)
GET    /api/notifications/unread-count Get unread count (protected)
```

---

## 9. Chat / Messaging

### Purpose
Direct messaging between users. Group chats. Optional end-to-end encryption. Real-time via Socket.IO.

### Data Models (MongoDB)

**conversations collection:**
```
_id            ObjectId
participants   [userId]
type           'direct' | 'group'
name           string nullable (for group chats)
isEncrypted    boolean default false
encryptionKey  string nullable (if encrypted)
lastMessage    string nullable
lastMessageAt  timestamp nullable
unreadCounts   Map<userId, number>
createdAt      timestamp
```

**messages collection:**
```
_id              ObjectId
conversationId   ObjectId
sender           userId
content          string nullable
type             'text' | 'image' | 'video' | 'file'
isEncrypted      boolean default false
encryptedContent string nullable
mediaUrl         string nullable
s3Key            string nullable
isRead           boolean default false
readAt           timestamp nullable
createdAt        timestamp

Index: conversationId + createdAt
```

### Business Logic
- **Create conversation:** find or create direct conversation between two users
- **Send message:** save message, update conversation.lastMessage, increment unreadCount for all participants except sender, emit via WebSocket
- **Mark read:** set isRead=true, readAt=now for all messages in conversation by user, reset unreadCount to 0
- **Encryption:** when enabled, encrypt message content with AES before storing; client receives encrypted content and decrypts with shared key
- **Media in chat:** generate presigned S3 URL for upload, store s3Key in message
- **Pagination:** messages paginated by cursor (createdAt), oldest first

### WebSocket Events
```
message:send         Client → Server: send a message
message:new          Server → Client: receive new message
message:typing       Client → Server: typing indicator
message:typing:stop  Client → Server: stopped typing
conversation:read    Client → Server: mark conversation read
```

### Endpoints
```
POST   /api/conversations                          Create or get direct conversation (protected)
GET    /api/conversations                          Get user's conversations (protected)
GET    /api/conversations/:id/messages             Get messages (protected, paginated)
POST   /api/conversations/:id/messages             Send message (protected)
PATCH  /api/conversations/:id/mark-read            Mark as read (protected)
POST   /api/conversations/:id/presigned-url        Get S3 URL for media upload
POST   /api/conversations/:id/enable-encryption    Enable E2E encryption (protected)
POST   /api/conversations/:id/disable-encryption   Disable encryption (protected)
```

---

## 10. Blogs

### Purpose
Long-form content platform. Users create blogs, write posts to blogs, others follow blogs.

### Data Models (MongoDB)

**blogs collection:**
```
_id           ObjectId
slug          string unique
title         string
description   string nullable
author        userId
followersCount number default 0
coverImage    string nullable (S3 URL)
featuredImage string nullable
category      string nullable
tags          string[]
privacy       'public' | 'private'
status        'draft' | 'published'
createdAt     timestamp
updatedAt     timestamp
```

**blog_followers collection:**
```
_id        ObjectId
blogId     ObjectId
userId     string
followedAt timestamp

Unique index: blogId + userId
```

### Business Logic
- Slug auto-generated from title (unique)
- Blog posts use the Posts module with `blogId` attached
- Suggested blogs based on category/tags matching user interests
- Popular blogs sorted by followersCount

### Endpoints
```
POST   /api/blogs                   Create blog (protected)
PATCH  /api/blogs/:id               Update blog (protected, owner only)
GET    /api/blogs/:slug             Get blog by slug
GET    /api/my-blogs                Current user's blogs (protected)
GET    /api/blogs/followed          Blogs user follows (protected)
GET    /api/blogs/suggested         Suggested blogs for user (protected)
GET    /api/blogs/popular           Popular blogs (public)
POST   /api/blogs/:id/follow        Follow blog (protected)
POST   /api/blogs/:id/unfollow      Unfollow blog (protected)
POST   /api/blogs/:id/upload-image  Upload blog cover image (protected)
GET    /api/blogs/:id/posts         Get posts in this blog (paginated)
```

---

## 11. Businesses

### Purpose
Business directory — create listings, search, reviews, photos, categories. Yelp-like functionality.

### Data Models (MongoDB)

**businesses collection:**
```
_id           ObjectId
name          string
slug          string unique
description   string nullable
owner         userId
category      string
subcategory   string nullable
location      { state, city, address, coordinates: { lat, lng } }
contact       { phone, email, website }
hours         [{ day, open, close, closed }]
rating        number default 0
reviewCount   number default 0
coverImage    string nullable (S3 URL)
logos         string[] (S3 URLs)
photos        string[] (S3 URLs)
verified      boolean default false
featured      boolean default false
createdAt     timestamp
updatedAt     timestamp
```

**business_reviews collection:**
```
_id         ObjectId
businessId  ObjectId
author      { id, username, avatar }
rating      number (1-5)
comment     string
createdAt   timestamp
```

**business_categories collection:**
```
_id         ObjectId
name        string
slug        string
icon        string nullable
subcategories string[]
```

**business_photos collection:**
```
_id        ObjectId
businessId ObjectId
url        string (S3 URL)
s3Key      string
caption    string nullable
uploadedAt timestamp
```

### Business Logic
- Search: full-text on name/description, filter by category/state/city/rating, sort by rating/distance/reviewCount
- Rating: recalculated on each review (average of all reviews)
- Owner can manage business; admins can verify/feature
- States/cities data sourced from cities module

### Endpoints
```
POST   /api/businesses                         Create business (protected)
PATCH  /api/businesses/:id                     Update business (protected, owner)
GET    /api/businesses/:slug                   Get by slug
GET    /api/businesses/search                  Search with filters
GET    /api/businesses/quick-search            Quick autocomplete search
GET    /api/my-businesses                      Current user's businesses (protected)
POST   /api/businesses/:id/reviews             Create review (protected)
GET    /api/businesses/:id/reviews             Get reviews
GET    /api/categories                         All business categories
GET    /api/categories/:id                     Get single category
GET    /api/states                             Get all states
GET    /api/states/:state/cities               Get cities for a state
POST   /api/businesses/:id/photos              Upload photos (protected, owner)
GET    /api/businesses/:id/photos              Get business photos
DELETE /api/businesses/:id/photos/:photoId     Delete photo (protected, owner)
```

---

## 12. Pages

### Purpose
Brand/organization pages. Followers, posts, team, products, promotions, reviews, messaging. Facebook Pages equivalent.

### Data Models (MongoDB)

**pages collection:**
```
_id           ObjectId
name          string
slug          string unique
description   string nullable
category      string
owner         userId
admins        [userId]
followersCount number default 0
coverPhoto    string nullable (S3 URL)
profilePhoto  string nullable (S3 URL)
phone         string nullable
email         string nullable
website       string nullable
address       string nullable
rating        number default 0
isVerified    boolean default false
featured      boolean default false
createdAt     timestamp
updatedAt     timestamp
```

**Related collections:** `page_messages`, `page_conversations`, `page_products`, `page_promotions`, `page_photos`, `page_reviews`

**page_products collection:**
```
_id        ObjectId
pageId     ObjectId
name       string
description string nullable
price      number
currency   string default 'USD'
images     string[] (S3 URLs)
inStock    boolean default true
createdAt  timestamp
```

### Business Logic
- Page posts use Posts module with `pageId` attached
- Team members (admins) can manage page content
- Page has its own messaging system (separate from user chat)
- Followers receive page posts in their feed

### Endpoints
```
POST   /api/pages                           Create page (protected)
GET    /api/pages                           Browse pages (paginated)
GET    /api/pages/:slug                     Get page details
PATCH  /api/pages/:id                       Update page (protected, owner/admin)
POST   /api/pages/:id/follow               Follow page (protected)
POST   /api/pages/:id/unfollow             Unfollow page (protected)
GET    /api/pages/:id/posts               Get page posts
GET    /api/pages/:id/team                Get page admins/team
GET    /api/pages/:id/followers           Get followers list
POST   /api/pages/:id/conversations       Create page conversation
GET    /api/pages/:id/messages            Get page messages
POST   /api/pages/:id/products            Create product (protected, admin)
GET    /api/pages/:id/products            Get page products
POST   /api/pages/:id/promotions          Create promotion (protected, admin)
POST   /api/pages/:id/reviews             Create review (protected)
GET    /api/pages/:id/reviews             Get page reviews
```

---

## 13. Groups

### Purpose
Community groups. Public/private/closed. Members, admins, posts.

### Data Model (MongoDB → groups collection)
```
_id          ObjectId
name         string
slug         string unique
description  string nullable
creator      userId
admins       [userId]
members      [userId]
membersCount number default 0
privacy      'public' | 'private' | 'closed'
coverImage   string nullable (S3 URL)
icon         string nullable (S3 URL)
rules        string nullable
createdAt    timestamp
updatedAt    timestamp
```

### Business Logic
- Public groups: anyone can join
- Private groups: must request to join, admin approves
- Closed groups: invite only
- Group posts use Posts module with `groupId` attached
- Admins can remove members, delete posts, update group settings

### Endpoints
```
POST   /api/groups            Create group (protected)
GET    /api/groups            Browse groups (paginated)
GET    /api/groups/:slug      Get group details
PATCH  /api/groups/:id        Update group (protected, admin)
DELETE /api/groups/:id        Delete group (protected, creator)
POST   /api/groups/:id/join   Join group (protected)
POST   /api/groups/:id/leave  Leave group (protected)
GET    /api/groups/:id/members Get members
GET    /api/my-groups         Groups current user belongs to (protected)
```

---

## 14. Clubs

### Purpose
Interest-based clubs/communities. Smaller, topic-focused groups.

### Data Model (MongoDB → clubs collection)
```
_id          ObjectId
name         string
slug         string unique
description  string nullable
category     string
creator      userId
members      [userId]
membersCount number default 0
privacy      'public' | 'private'
rules        string nullable
coverImage   string nullable (S3 URL)
createdAt    timestamp
updatedAt    timestamp
```

**club_members collection:**
```
_id       ObjectId
clubId    ObjectId
userId    string
role      'member' | 'admin'
joinedAt  timestamp
```

### Endpoints
```
POST   /api/clubs             Create club (protected)
GET    /api/clubs             Browse clubs
GET    /api/clubs/:slug       Get club details
PATCH  /api/clubs/:id         Update club (protected, admin)
POST   /api/clubs/:id/join    Join club (protected)
POST   /api/clubs/:id/leave   Leave club (protected)
GET    /api/clubs/:id/members Get members
GET    /api/my-clubs          Clubs user belongs to (protected)
```

---

## 15. Professional Profile

### Purpose
LinkedIn-style professional profiles. Work history, education, skills, certifications, recommendations.

### Data Model (MongoDB → professional_profiles collection)
```
_id             ObjectId (= userId)
userId          string
headline        string nullable
summary         string nullable
currentTitle    string nullable
currentCompany  string nullable
location        string nullable
skills          [{ name, endorsements: number }]
workHistory     [{
  title, company, location
  startDate, endDate, current
  description
}]
education       [{
  institution, degree, field
  startYear, endYear
  description
}]
certifications  [{ name, issuer, issueDate, expiryDate, credentialUrl }]
languages       [{ language, proficiency }]
recommendations [{ fromUserId, fromName, text, date }]
followersCount  number default 0
profileUrl      string nullable (LinkedIn URL)
createdAt       timestamp
updatedAt       timestamp
```

### Endpoints
```
GET    /api/professional-profiles/:userId          Get professional profile
PATCH  /api/professional-profiles/:userId          Update (protected, own profile)
POST   /api/professional-profiles/:userId/followers Follow professional profile (protected)
GET    /api/professional-profiles/:userId/followers Get followers
POST   /api/professional-profiles/:userId/recommendations  Add recommendation (protected)
```

---

## 16. Professional Services

### Purpose
Service marketplace — professionals list services they offer; others book them.

### Data Model (MongoDB → professional_services collection)
```
_id           ObjectId
provider      userId
title         string
description   string
category      string
subcategory   string nullable
price         number
priceType     'fixed' | 'hourly' | 'negotiable'
currency      string default 'USD'
deliveryTime  string nullable (e.g., "3-5 days")
images        string[] (S3 URLs)
tags          string[]
location      string nullable
isRemote      boolean default true
rating        number default 0
reviewCount   number default 0
isActive      boolean default true
createdAt     timestamp
updatedAt     timestamp
```

### Endpoints
```
POST   /api/professional-services          Create service listing (protected)
GET    /api/professional-services          Search/browse services
GET    /api/professional-services/:id      Get service details
PATCH  /api/professional-services/:id      Update service (protected, owner)
DELETE /api/professional-services/:id      Delete service (protected, owner)
POST   /api/professional-services/:id/book Book a service (protected)
GET    /api/my-services                    Current user's services (protected)
```

---

## 17. Live Streaming

### Purpose
Live video broadcast using AWS IVS. Viewers join stream, post real-time comments. Host controls stream lifecycle.

### Data Model (MongoDB → live_streams collection)
```
_id                ObjectId
host               userId
title              string
description        string nullable
ivsChannelArn      string (AWS IVS ARN)
ivsPlaybackUrl     string (HLS playback URL)
ivsIngestEndpoint  string (RTMP ingest URL)
ivsStreamKey       string (stream key for OBS etc.)
status             'pending' | 'live' | 'ended'
viewersCount       number default 0
duration           number nullable (seconds, set on end)
recording          boolean default false
recordingUrl       string nullable (S3 URL of recording)
comments           [{ userId, username, avatar, text, createdAt }]
thumbnail          string nullable (S3 URL)
createdAt          timestamp
endedAt            timestamp nullable
```

### Business Logic
- **Start stream:** create IVS channel via AWS SDK, return ingest endpoint + stream key to host
- **End stream:** set status=ended, endedAt=now, compute duration, optionally save recording
- **Viewers:** track count via WebSocket connections (increment on join, decrement on disconnect)
- **Comments:** stored in document array for replay, emitted via WebSocket in real-time

### WebSocket Events
```
stream:join          Client joins stream room
stream:leave         Client leaves stream
stream:comment       Client posts comment
stream:viewer-count  Server emits updated viewer count
stream:ended         Server emits when host ends stream
```

### Endpoints
```
POST   /api/live-streams              Start live stream (protected)
GET    /api/live-streams              Get all active streams
GET    /api/live-streams/:id          Get stream details
PATCH  /api/live-streams/:id/end      End stream (protected, host only)
POST   /api/live-streams/:id/comments Add comment to live stream (protected)
GET    /api/live-streams/:id/comments Get stream comments
```

---

## 18. Search

### Purpose
Full-text cross-entity search — users, posts, businesses, blogs, pages, groups.

### Business Logic
- Global search queries multiple collections and merges results
- Filtered search by type narrows to one collection
- User search: by username, firstName, lastName
- Post search: by content text
- Business search: by name, description, category, location
- Blog search: by title, description, tags
- Results ranked by relevance score + recency

### Endpoints
```
GET    /api/search              Global search (query param: q, type)
GET    /api/search/users        Search users (query param: q)
GET    /api/search/posts        Search posts (query param: q)
GET    /api/search/businesses   Search businesses (query params: q, category, state, city)
GET    /api/search/blogs        Search blogs (query param: q)
GET    /api/search/pages        Search pages (query param: q)
GET    /api/search/groups       Search groups (query param: q)
```

---

## 19. Cities / Location Data

### Purpose
Location reference data used for profile completion, business listings, search filters.

### Data Model (MongoDB → cities collection)
```
_id         ObjectId
name        string
state       string
country     string
coordinates { lat, lng }
```

**city_categories collection:**
```
_id     ObjectId
name    string
slug    string
icon    string nullable
```

### Endpoints
```
GET    /api/cities         Get all cities (filterable by state)
GET    /api/cities/:id     Get city details
GET    /api/categories     Get city categories
```

---

## 20. Media / File Upload

### Purpose
Centralized S3-based file storage with presigned URLs, CloudFront CDN delivery, support for images and videos.

### Logic
- **Upload flow:**
  1. Client requests presigned URL(s) via API
  2. API generates S3 presigned PUT URL (15-min expiry) with target key
  3. Client uploads file directly to S3 (no server proxy)
  4. Client confirms upload success to API with s3Key
  5. API stores s3Key + CloudFront URL in DB

- **S3 key format:** `{module}/{userId}/{uuid}.{ext}` (e.g., `posts/abc123/xyz.jpg`)
- **CloudFront URL format:** `https://{cloudfront-domain}/{s3Key}`
- **Max file size:** 500MB (configurable via `MAX_FILE_SIZE_MB`)
- **Presigned URL expiration:** 900 seconds / 15 minutes

### Endpoints (centralized)
```
POST   /api/upload/presigned-url        Get single presigned URL
POST   /api/upload/presigned-urls       Get multiple presigned URLs (batch)
DELETE /api/upload/:s3Key               Delete file from S3 (protected, owner)
```

---

## 21. Email Service

### Purpose
Multi-provider transactional email with HTML templates. Used for OTP, password reset, notifications.

### Providers (in order of preference)
1. **AWS SES** — production default
2. **SendGrid** — alternative/fallback
3. **Mailtrap** — staging/sandbox
4. **Nodemailer** — SMTP fallback

### Email Types
```
VERIFY_EMAIL        OTP code for email verification
WELCOME             After email is verified
PASSWORD_RESET      Reset link with token
FRIEND_REQUEST      Notification email
NEW_MESSAGE         Chat message notification
```

### Logic
- Provider selected via `EMAIL_PROVIDER` env var
- Templates rendered with Handlebars
- Email jobs pushed to Bull queue for async processing
- Failed sends retried up to 3 times with exponential backoff

---

## 22. Job Queues

### Purpose
Async job processing using Bull (Redis-backed). Prevents blocking HTTP responses for slow operations.

### Queues
```
email-queue         Send transactional emails
notification-queue  Create and deliver notifications
webhook-queue       Outbound webhook delivery
media-queue         Post-upload processing (resize, thumbnail)
```

### Logic
- Jobs added to queue return immediately to caller
- Processors pick up jobs from Redis queue
- Retry on failure: 3 attempts, exponential backoff
- Bull Board dashboard at `/admin/queues` (admin only)
- Dead-letter queue for permanently failed jobs

---

## 23. Real-time / WebSockets

### Purpose
Socket.IO-based real-time events. Redis adapter for multi-instance scaling.

### Connection
- Client connects with JWT in handshake auth: `{ auth: { token: 'Bearer ...' } }`
- Server validates JWT on connection
- User joined to personal room: `user:{userId}`

### Global Events
```
Server → Client:
  notification:new          New notification
  friend_request:new        New friend request
  friend_request:accepted   Friend accepted request
  user:online               Friend came online
  user:offline              Friend went offline

Client → Server:
  user:typing               Typing in chat
  user:stop-typing          Stopped typing
```

### Module-specific Gateways
```
ChatGateway          message:new, message:typing, conversation:read
PostGateway          post:new, post:updated
CommentGateway       comment:new
NotificationGateway  notification:new
FriendshipsGateway   friendship:update
LiveStreamGateway    stream:join, stream:comment, stream:viewer-count
GroupsGateway        group:post:new
PagesGateway         page:message:new
```

---

## 24. Health Checks

### Endpoints
```
GET    /health         Full health check (DB connections, Redis, etc.)
GET    /health/ready   Readiness probe (returns 200 when app ready to serve)
GET    /health/live    Liveness probe (returns 200 if app is alive)
```

---

## 25. Database Schema Reference

### PostgreSQL Tables
| Table | Purpose |
|-------|---------|
| `users` | Auth — core user credentials & status |

### MongoDB Collections
| Collection | Purpose |
|-----------|---------|
| `user_profiles` | Extended user profiles |
| `profile_albums` | User photo albums |
| `profile_photos` | Photos in albums |
| `profile_videos` | User videos |
| `user_about` | About section data |
| `user_work_education` | Work & education history |
| `user_interests_hobbies` | Interests data |
| `user_featured_photos` | Featured/pinned photos |
| `user_life_events` | Life milestone events |
| `user_places_lived` | Places lived history |
| `user_privacy_settings` | Per-feature privacy config |
| `user_media_gallery` | Full media gallery |
| `posts` | All posts/feed content |
| `stories` | Ephemeral stories (TTL 24h) |
| `comments` | Post comments & replies |
| `reactions` | Emoji reactions on posts/comments |
| `notifications` | In-app notifications |
| `friendships` | Friend connections & requests |
| `conversations` | Chat conversation threads |
| `messages` | Chat messages |
| `blogs` | Blog metadata |
| `blog_followers` | Blog follow relationships |
| `businesses` | Business directory listings |
| `business_reviews` | Business reviews |
| `business_categories` | Business category taxonomy |
| `business_photos` | Business photo uploads |
| `pages` | Brand/organization pages |
| `page_messages` | Page messaging |
| `page_conversations` | Page conversation threads |
| `page_products` | Products listed on pages |
| `page_promotions` | Page promotions |
| `page_reviews` | Page reviews |
| `groups` | Community groups |
| `clubs` | Interest clubs |
| `club_members` | Club membership |
| `professional_profiles` | Professional CV profiles |
| `professional_services` | Service listings |
| `live_streams` | Live stream sessions |
| `cities` | Location reference data |
| `city_categories` | City category taxonomy |

---

## 26. Environment Variables Reference

### App
```
NODE_ENV                    development | production
PORT                        3001
JWT_SECRET                  (32+ char secret)
JWT_EXPIRES_IN              24h
FRONTEND_URL                http://localhost:3000
```

### PostgreSQL
```
DATABASE_URL                postgresql://user:pass@host:port/db
DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME
DB_SSL                      false | true
```

### MongoDB
```
MONGODB_URI                 mongodb://localhost:27017/yeebaam_local
```

### Redis
```
REDIS_URL                   redis://host:port
REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
```

### AWS
```
AWS_REGION                  us-east-1
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET_NAME          yeebaam-media
AWS_CLOUDFRONT_URL          https://xxx.cloudfront.net
MAX_FILE_SIZE_MB             500
PRESIGNED_URL_EXPIRATION_SECONDS  900
```

### Email
```
EMAIL_PROVIDER              ses | sendgrid | mailtrap | nodemailer
MAIL_FROM_ADDRESS           noreply@yeebaam.com
MAIL_FROM_NAME              Yeebaam
SENDGRID_API_KEY
MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD  (SMTP/Mailtrap)
```

### Twilio
```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
```

---

## Implementation Phases

**Phase 1 (core social graph — in progress):**
Auth · User Profile · Media Upload · Posts/Feed · Comments · Reactions · Friendships · Notifications · Stories

**Phase 2 (messaging + communities):**
Chat · Search · Blogs · Pages · Groups · Clubs

**Phase 3 (marketplace + pro):**
Businesses · Professional Profile · Professional Services

**Phase 4 (deferred, needs external services):**
Live Streaming (Livepeer/Mux) · Push Notifications (OneSignal)

---

## Migration Priority Order

| Priority | Module | Complexity | Notes |
|----------|--------|------------|-------|
| 1 | Authentication | Medium | Core — everything depends on this |
| 2 | User Profile | Medium | Required before social features |
| 3 | Media Upload | Low | Required for posts, stories, pages |
| 4 | Posts / Feed | High | Core social feature |
| 5 | Stories | Medium | Depends on posts + media |
| 6 | Comments | Medium | Depends on posts |
| 7 | Reactions | Low | Depends on posts |
| 8 | Friendships | Medium | Depends on users |
| 9 | Notifications | Medium | Depends on friendships, posts |
| 10 | Chat | High | Real-time, encryption |
| 11 | Search | Medium | Cross-module |
| 12 | Blogs | Medium | Depends on posts |
| 13 | Pages | High | Multiple sub-entities |
| 14 | Groups | Medium | Depends on posts |
| 15 | Clubs | Low | Similar to groups |
| 16 | Businesses | High | Search, reviews, photos |
| 17 | Professional Profile | Medium | Standalone |
| 18 | Professional Services | Medium | Depends on professional profile |
| 19 | Live Streaming | High | AWS IVS dependency |
| 20 | Cities | Low | Reference data only |
| 21 | Email Service | Low | Cross-cutting, configure early |
| 22 | Job Queues | Medium | Cross-cutting async layer |
| 23 | WebSockets / Real-time | High | Cross-cutting, configure early |
