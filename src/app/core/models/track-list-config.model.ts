export interface TrackListConfig {
  type: string;

  filters: {
    author?: string,
    limit?: number,
    offset?: number
  };
}
