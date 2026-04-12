import { socketManager } from './socket-manager';

export const getUsersSocket = () => socketManager.getSocket('/users');
export const getPostsSocket = () => socketManager.getSocket('/posts');
export const getStoriesSocket = () => socketManager.getSocket('/stories');
export const getReactionsSocket = () => socketManager.getSocket('/reactions');
export const getCommentsSocket = () => socketManager.getSocket('/comments');
export const getNotificationsSocket = () => socketManager.getSocket('/notifications');
export const getFriendshipsSocket = () => socketManager.getSocket('/friendships');

export const forceReinitializeSockets = () => socketManager.forceReinitialize();
