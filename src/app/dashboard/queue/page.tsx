export default function ContentQueue() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Content Queue</h1>
        <p className="text-gray-600">Review and approve AI-generated content before posting.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Coming in Phase 6</h3>
        <p className="text-gray-600 mb-4">
          Content queue management will be available in Phase 6 with:
        </p>
        <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
          <li>• AI-generated content review</li>
          <li>• Approve/Reject workflow</li>
          <li>• Edit and refine content</li>
          <li>• Schedule posts</li>
        </ul>
      </div>
    </div>
  )
}
