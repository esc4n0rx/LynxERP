'use client';

import { useState, useRef } from 'react';
import { useSessionStore } from '@/store/session';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { MaterialAPI } from '@/lib/api/material';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface MaterialUploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function MaterialUploadModal({ open, onOpenChange, onSuccess }: MaterialUploadModalProps) {
    const { token } = useSessionStore();
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<{ success: number; errors: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setUploadResult(null);
        }
    };

    const handleUpload = async () => {
        if (!token || !file) return;

        try {
            setIsUploading(true);
            setUploadResult(null);

            const result = await MaterialAPI.upload(token, file);

            // Assuming API returns something like { processed: number, errors: [] }
            // Adjust based on actual API response if needed. 
            // The current MaterialAPI.upload returns `any`.

            toast({
                title: 'Upload concluído',
                description: 'O arquivo foi processado.',
            });

            // Mocking result for now if API doesn't return detailed stats yet
            setUploadResult({
                success: result.processed || 0,
                errors: result.errors || []
            });

            if (!result.errors || result.errors.length === 0) {
                setTimeout(() => {
                    onSuccess();
                    onOpenChange(false);
                    setFile(null);
                    setUploadResult(null);
                }, 2000);
            }

        } catch (error: any) {
            toast({
                title: 'Erro no upload',
                description: error.message || 'Falha ao enviar arquivo',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setUploadResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!isUploading) onOpenChange(v); }}>
            <DialogContent className="bg-neutral-950 border-neutral-800 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload em Massa de Materiais</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Selecione um arquivo CSV para importar materiais.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-800 rounded-lg p-6 hover:bg-neutral-900/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <FileSpreadsheet className="h-10 w-10 text-neutral-500 mb-2" />
                        <p className="text-sm text-neutral-400">
                            {file ? file.name : "Clique para selecionar ou arraste o arquivo"}
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".csv"
                            onChange={handleFileChange}
                        />
                    </div>

                    {uploadResult && (
                        <div className="space-y-2">
                            {uploadResult.errors.length > 0 ? (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Erros encontrados</AlertTitle>
                                    <AlertDescription>
                                        <ul className="list-disc pl-4 text-xs max-h-32 overflow-y-auto">
                                            {uploadResult.errors.map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <Alert className="border-green-900 bg-green-900/20 text-green-400">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertTitle>Sucesso!</AlertTitle>
                                    <AlertDescription>
                                        Todos os registros foram processados corretamente.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isUploading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleUpload} disabled={!file || isUploading}>
                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Upload
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
