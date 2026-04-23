export type Query = {
  id: number;
  timestamp: number;
  duration: number;
  sql: string;
}

export type Queries = Query[]

export type StatEntry = {
  count: number;
  totalDuration: number;
  averageDuration: number;
}

export type Stats = Record<string, Record<string, StatEntry>>

export type StatsProgress = [number, number]

export type Message = {
  type: 'queries',
  data: Queries
} | {
  type: 'stats',
  data: Stats
} | {
  type: 'stats-progress',
  data: StatsProgress
}

export type ActionMessage = {
  action: 'clear' | 'stats';
}
