export default function GenerateContent() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Generate Content</h1>
        <p className="text-gray-600">Create AI-powered content for your social media channels.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Coming in Phase 6</h3>
        <p className="text-gray-600 mb-4">
          AI content generation will be available in Phase 6 with:
        </p>
        <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
          <li>• Platform-specific content generation</li>
          <li>• Voice-matched writing style</li>
          <li>• Topic-based content creation</li>
          <li>• Genre-aware content suggestions</li>
        </ul>
      </div>
    </div>
  )
}
