import { Profile } from './profile.model';

export interface Track {
  slug: string;
  title: string;
  description: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: Profile;
}
