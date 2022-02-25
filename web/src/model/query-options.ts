export type Reporter = 'source' | 'destination' | 'both';

export type Match = 'all' | 'any' | 'srcOrDst';

export interface QueryOptions {
  reporter: Reporter;
  match: Match;
  limit: number;
}
