import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function AppNotFound() {
  return (
    <div className="container mx-auto p-6">
      <Card className="border-neutral-800 bg-neutral-900 p-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          App não encontrado
        </h3>
        <p className="text-neutral-400">
          O aplicativo solicitado não pôde ser carregado.
        </p>
      </Card>
    </div>
  );
}
