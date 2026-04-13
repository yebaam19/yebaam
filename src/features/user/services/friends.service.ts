import { friendshipsService } from '@/features/friendships/services/friendships.service';

export interface Friend {
  friendId: string;
  friendshipId?: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  friendSince: string;
  closeFriend: boolean;
  mutualFriends?: number;
  location?: string | { city?: string; country?: string };
}

export interface GetFriendsResponse {
  friends: Friend[];
  total: number;
  closeFriends: Friend[];
}

export const friendsService = {
  async getFriends(): Promise<GetFriendsResponse> {
    const list = await friendshipsService.getFriends();
    const friends: Friend[] = list.friends.map((f) => ({
      friendId: f.friendId,
      friendshipId: f.friendshipId,
      username: f.username,
      firstName: f.firstName ?? '',
      lastName: f.lastName ?? '',
      avatar: f.avatar,
      friendSince: f.friendSince,
      closeFriend: f.closeFriend,
    }));
    return {
      friends,
      total: list.count,
      closeFriends: friends.filter((f) => f.closeFriend),
    };
  },

  async getCloseFriends(): Promise<Friend[]> {
    const result = await this.getFriends();
    return result.closeFriends;
  },

  async toggleCloseFriend(
    friendId: string
  ): Promise<{ success: boolean; closeFriend: boolean }> {
    const list = await friendshipsService.getFriends();
    const current = list.friends.find((f) => f.friendId === friendId);
    const newValue = !(current?.closeFriend ?? false);
    await friendshipsService.updateFriendConfig(friendId, { closeFriend: newValue });
    return { success: true, closeFriend: newValue };
  },

  async removeFriend(
    friendshipId: string
  ): Promise<{ success: boolean; message: string }> {
    return friendshipsService.removeFriend(friendshipId);
  },
};
