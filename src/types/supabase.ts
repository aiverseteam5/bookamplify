// Simple types without strict Supabase typing for now
 
export interface Database {
  public: {
    Tables: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      authors: any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      book_chunks: any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      social_connections: any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content_items: any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      agent_runs: any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subscriptions: any
    }
  }
}
