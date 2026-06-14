export interface RequestProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface RequesterProfileData {
  friendshipId: string;
  requesterId: string;
  addresseeId: string;
  message?: string;
  sentAt: string;
  status: string;
  profile: RequestProfile;
  profileType: 'requester' | 'addressee';
}

export type FriendRequestAction = 'accept' | 'reject' | 'cancel';
