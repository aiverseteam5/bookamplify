// Simple test file to verify database connection after manual migration
import { supabase } from '@/lib/supabase'

export async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { error } = await supabase
      .from('authors')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Connection test failed:', error)
      return false
    }
    
    console.log('✅ Database connection successful!')
    return true
  } catch (error) {
    console.error('❌ Connection test error:', error)
    return false
  }
}

// Run this test after manual migration: 
// npx tsx src/test-db-connection.ts
