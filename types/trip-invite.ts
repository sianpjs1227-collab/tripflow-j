export interface TripInvite {
  id: string;
  tripId: string;
  token: string;
  createdBy: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export interface TripInvitePreview {
  tripId: string;
  title: string;
  country: string;
  city: string;
  ownerName: string;
  expiresAt: string;
  expired: boolean;
  alreadyMember: boolean;
}
