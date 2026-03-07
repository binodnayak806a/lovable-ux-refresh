import { Construction } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface ModulePlaceholderProps {
  moduleName: string;
  description?: string;
  icon?: React.ElementType;
}

export default function ModulePlaceholder({ moduleName, description, icon: Icon = Construction }: ModulePlaceholderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{moduleName}</h1>
          {description && <p className="text-gray-500 text-sm mt-0.5">{description}</p>}
        </div>
        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
          In Development
        </Badge>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700">{moduleName}</h3>
          <p className="text-gray-400 text-sm mt-2 max-w-sm">
            This module is part of the wellnotes HMS 47-module system and is currently being developed.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">Coming soon in the next sprint</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
