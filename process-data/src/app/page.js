import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Brand Matching System</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">About This Tool</h2>
          <p className="mb-4">
            This brand matching system helps you identify and normalize brand names across different e-commerce platforms 
            like Amazon and Flipkart. It uses fuzzy matching to suggest potential matches and allows you to manually 
            verify and group brands.
          </p>
          <p className="mb-4">
            Common challenges addressed:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Different spellings (e.g., "LAKMÉ" vs "LAKME")</li>
            <li>Case differences (e.g., "VIM" vs "vim")</li>
            <li>Brand grouping (e.g., "Horlicks Women" and "Horlicks")</li>
            <li>Platform-specific brand naming conventions</li>
          </ul>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <p className="mb-4">
            Follow these steps to match and normalize brands:
          </p>
          <ol className="list-decimal pl-6 mb-4 space-y-2">
            <li>Initialize the database (first-time setup only)</li>
            <li>Browse brands from Amazon and Flipkart</li>
            <li>Use the fuzzy matching tool to find potential matches</li>
            <li>Select brands to group together</li>
            <li>Provide a canonical name for the group</li>
            <li>Save the group for future reference</li>
          </ol>
          <div className="mt-6">
            <Link 
              href="/brand-matcher" 
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Go to Brand Matcher
            </Link>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">First-time Setup</h2>
          <p className="mb-4">
            If this is your first time using the system, you need to initialize the database:
          </p>
          <div className="mt-4">
            <Link 
              href="/api/init-db" 
              className="inline-flex items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
              target="_blank"
            >
              Initialize Database
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
