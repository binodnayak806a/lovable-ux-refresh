import { useNavigate } from 'react-router-dom';
import { Home, Search, FileQuestion } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <FileQuestion className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full"
            size="lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Go Back
          </Button>
          <Button
            onClick={() => {
              navigate('/dashboard');
              setTimeout(() => {
                const searchButton = document.querySelector('[aria-label*="search"]') as HTMLElement;
                searchButton?.click();
              }, 100);
            }}
            variant="ghost"
            className="w-full"
            size="lg"
          >
            <Search className="w-4 h-4 mr-2" />
            Search Patients
          </Button>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          If you believe this is an error, please contact your system administrator.
        </p>
      </div>
    </div>
  );
}
