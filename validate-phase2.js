const fs = require('fs')
const path = require('path')

console.log('🔍 Validating Phase 2 Implementation...\n')

const requiredFiles = [
  'supabase/migrations/001_initial_schema.sql',
  'supabase/config.toml',
  'src/types/supabase.ts',
  'src/lib/supabase.ts',
  'src/lib/anthropic.ts',
  'src/lib/openai.ts',
  'src/lib/genreSkills.ts',
  'src/app/page.tsx',
  'src/app/layout.tsx',
  'src/test-db-connection.ts'
]

const validationResults = {
  passed: 0,
  failed: 0,
  details: []
}

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file)
  const exists = fs.existsSync(filePath)
  
  if (exists) {
    validationResults.passed++
    validationResults.details.push(`✅ ${file}`)
  } else {
    validationResults.failed++
    validationResults.details.push(`❌ ${file} - MISSING`)
  }
})

// Validate migration content
const migrationPath = path.join(__dirname, 'supabase/migrations/001_initial_schema.sql')
if (fs.existsSync(migrationPath)) {
  const migrationContent = fs.readFileSync(migrationPath, 'utf8')
  const requiredTables = ['authors', 'book_chunks', 'social_connections', 'content_items', 'agent_runs', 'subscriptions']
  
  requiredTables.forEach(table => {
    if (migrationContent.includes(`create table ${table}`)) {
      validationResults.passed++
      validationResults.details.push(`✅ Migration includes ${table} table`)
    } else {
      validationResults.failed++
      validationResults.details.push(`❌ Migration missing ${table} table`)
    }
  })
  
  // Check for extensions
  if (migrationContent.includes('create extension if not exists vector')) {
    validationResults.passed++
    validationResults.details.push('✅ Migration includes vector extension')
  } else {
    validationResults.failed++
    validationResults.details.push('❌ Migration missing vector extension')
  }
}

// Print results
console.log('📊 Validation Results:')
console.log(`✅ Passed: ${validationResults.passed}`)
console.log(`❌ Failed: ${validationResults.failed}`)
console.log('\n📋 Details:')
validationResults.details.forEach(detail => console.log(detail))

if (validationResults.failed === 0) {
  console.log('\n🎉 Phase 2 validation PASSED! Ready for manual migration.')
} else {
  console.log('\n⚠️  Phase 2 has issues that need attention.')
}
