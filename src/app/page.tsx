import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            BookAmplify
          </h1>
          <h2 className="text-2xl md:text-3xl text-gray-700 mb-8">
            AI-Powered Marketing for Authors
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your book marketing with AI. Upload your manuscript, connect your social accounts, 
            and let our intelligent agents create authentic content that sounds just like you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/auth/login"
              className="bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-3xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Upload Your Manuscript
            </h3>
            <p className="text-gray-600">
              Our AI analyzes your writing style to create content that sounds exactly like you
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              AI Content Generation
            </h3>
            <p className="text-gray-600">
              Generate social media posts, newsletters, and marketing content tailored to your voice
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-3xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Approve & Post
            </h3>
            <p className="text-gray-600">
              Review all content before it goes live. Nothing posts without your explicit approval
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
