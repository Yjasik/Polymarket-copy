// frontend/src/app/not-found.tsx
import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
        <FileQuestion className="h-12 w-12 text-gray-500 dark:text-gray-400" />
      </div>
      <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
        Page not found
      </h2>
      <p className="mt-2 max-w-md text-gray-600 dark:text-gray-400">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        Go to Home
      </Link>
    </div>
  );
}