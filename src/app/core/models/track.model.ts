import { Profile } from './profile.model';
export interface TPoint {
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  course: number;
  speed: number;
  d1: number;
  d2: number;
  flag: number;
  private: number;
}

export interface TrackData {
  slug: string;
  points: TPoint[];
}

export interface Track {
  slug: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  author: Profile;
  trackData: TrackData;
}
