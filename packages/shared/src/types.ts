export type UUID = string;

export interface Profile {
  id: UUID;
  phone?: string | null;
  display_name: string;
  age_verified: boolean;
  borough?: string | null;
  is_guest: boolean;
  created_at: string;
}

export type RoomStatus = "draft" | "live" | "ended";

export interface Room {
  id: UUID;
  code: string;
  host: UUID;
  status: RoomStatus;
  borough?: string | null;
  created_at: string;
}

export type MemberRole = "host" | "player";

export interface RoomMember {
  room_id: UUID;
  user_id: UUID;
  nickname: string;
  joined_at: string;
  role: MemberRole;
}

export interface Session {
  id: UUID;
  room_id: UUID;
  started_at: string;
  ended_at?: string | null;
  is_practice: boolean;
}

export interface Prompt {
  id: UUID;
  text: string;
  type: "hot_take" | "callout" | "dare";
  tags: string[];
  risk: number;
  locale: string;
  active: boolean;
}
