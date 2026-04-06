export default function Connections() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
        <p className="text-gray-600">Manage your social media account connections.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Coming in Phase 6</h3>
        <p className="text-gray-600 mb-4">
          Social media connections will be available in Phase 6 with:
        </p>
        <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
          <li>• Instagram OAuth integration</li>
          <li>• Twitter/X OAuth integration</li>
          <li>• LinkedIn OAuth integration</li>
          <li>• YouTube OAuth integration</li>
        </ul>
      </div>
    </div>
  )
}
