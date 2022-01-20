export type Reporter = 'source' | 'destination' | 'both';

export interface QueryOptions {
  reporter: Reporter;
  limit: number;
}
