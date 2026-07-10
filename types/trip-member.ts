/** Trip 멤버 역할 — 공유 여행 권한 */
export type TripMemberRole = "owner" | "editor" | "viewer";

/** 앱에서 사용하는 trip_members 형태 */
export interface TripMember {
  id: string;
  tripId: string;
  userId: string;
  role: TripMemberRole;
  createdAt: string;
}
