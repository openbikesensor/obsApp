import { Profile } from './profile.model';
export interface TPoint {
  date: string;
  time: string;
  latitude: number|null;
  longitude: number|null;
  course: number|null;
  speed: number|null;
  d1: number|null;
  d2: number|null;
  flag: number|null;
  private: boolean|null;
}

export interface TrackData {
  slug: string;
  points: TPoint[];
}

export interface Track {
  slug: string;
  title: string;
  description: string;
  body: string | null;
  createdAt: string;
  updatedAt: string;
  author: Profile;
  trackData: TrackData;
  visible: Boolean;
}
