export const SAMPLE_PAYLOADS: Record<string, unknown> = {
  'post_created': {
    _id: 'post-123',
    content: 'Post de prueba desde WebSocket',
    authorId: 'user-1',
    authorUsername: 'TestUser',
    authorFirstName: 'Test',
    authorLastName: 'User',
    authorAvatar: 'https://example.com/avatar.jpg',
    backgroundColor: '#ffffff',
    privacy: 'public',
    mediaFiles: [],
    reactionsCount: {
      like: 0,
      love: 0,
      haha: 0,
      wow: 0,
      sad: 0,
      angry: 0,
    },
    commentsCount: 0,
    sharesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'post_updated': {
    postId: 'post-123',
    content: 'Post actualizado desde WebSocket',
    backgroundColor: '#f0f0f0',
    privacy: 'friends',
  },
  'post_deleted': 'post-123',
  'post_add_reaction': {
    post: {
      _id: 'post-123',
      reactionsCount: {
        like: 5,
        love: 2,
        haha: 0,
        wow: 0,
        sad: 0,
        angry: 0,
      },
    },
    reactions: [
      {
        userId: 'user-2',
        type: 'like',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  'post_remove_reaction': {
    post: {
      _id: 'post-123',
      reactionsCount: {
        like: 4,
        love: 2,
        haha: 0,
        wow: 0,
        sad: 0,
        angry: 0,
      },
    },
    reactions: [],
  },
  'post_upload_media': {
    postId: 'post-123',
    mediaFiles: [
      {
        id: 'media-1',
        url: 'https://example.com/image.jpg',
        type: 'image',
        s3Key: 'posts/123/media-1.jpg',
        cloudFrontUrl: 'https://cdn.example.com/image.jpg',
      },
    ],
  },
  'post_replace_media': {
    postId: 'post-123',
    mediaFiles: [
      {
        id: 'media-2',
        url: 'https://example.com/new-image.jpg',
        type: 'image',
        s3Key: 'posts/123/media-2.jpg',
        cloudFrontUrl: 'https://cdn.example.com/new-image.jpg',
      },
    ],
  },
  'post_remove_media': {
    postId: 'post-123',
    mediaId: 'media-1',
  },
  'user_profile_updated': {
    userId: 'user-1',
    username: 'TestUser',
    updates: {
      bio: 'Nueva biografía',
      location: 'Ciudad de México',
    },
  },
  'user_avatar_updated': {
    userId: 'user-1',
    username: 'TestUser',
    avatarUrl: 'https://example.com/avatar.jpg',
  },
  'user_status_changed': {
    userId: 'user-1',
    username: 'TestUser',
    status: 'online', // online | offline | away
    lastSeen: new Date().toISOString(),
  },
  'friend_request_received': {
    requestId: 'req-123',
    from: {
      id: 'user-2',
      username: 'JohnDoe',
      avatar: 'https://example.com/john.jpg',
    },
    timestamp: new Date().toISOString(),
  },
  'friend_online': {
    friendId: 'user-2',
    username: 'JohnDoe',
    status: 'online',
  },
  'user_typing': {
    userId: 'user-2',
    username: 'JohnDoe',
    chatId: 'chat-123',
  },
  'message:new': {
    messageId: 'msg-123',
    chatId: 'chat-123',
    from: {
      id: 'user-2',
      username: 'JohnDoe',
    },
    content: 'Hola! ¿Cómo estás?',
    timestamp: new Date().toISOString(),
  },
};
