import { useState, useRef } from 'react';
import { Upload, X, File as FileIcon, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { uploadFileWithProgress } from '../../services/storage';

interface FileUploadProps {
    onFilesUploaded: (urls: string[]) => void;
    generatePath: (fileName: string) => string;
    accept?: string;
    multiple?: boolean;
    maxSizeMB?: number;
}

export const FileUpload = ({
    onFilesUploaded,
    generatePath,
    accept = '*/*',
    multiple = true,
    maxSizeMB = 20
}: FileUploadProps) => {
    const { t } = useTranslation();
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string }>>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        const validFiles: File[] = [];

        // Validate files
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.size > maxSizeBytes) {
                alert(t('fileUpload.error.fileTooBig', { name: file.name, size: maxSizeMB }));
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) return;

        setUploading(true);
        const uploadedUrls: string[] = [];

        try {
            for (const file of validFiles) {
                const path = generatePath(file.name);

                const url = await uploadFileWithProgress(
                    file,
                    path,
                    (progress) => {
                        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
                    }
                );

                uploadedUrls.push(url);
                setUploadedFiles(prev => [...prev, { name: file.name, url }]);

                // Remove progress for this file after completion
                setUploadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[file.name];
                    return newProgress;
                });
            }

            onFilesUploaded(uploadedUrls);
        } catch (error) {
            console.error('Error uploading files:', error);
            alert(t('fileUpload.error.uploadFailed'));
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('fileUpload.label')}
                </label>
                <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-gray-300 rounded-xl p-6 text-center ${uploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-orange-500'
                        } transition-colors`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        accept={accept}
                        multiple={multiple}
                        className="hidden"
                        disabled={uploading}
                    />
                    <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-sm text-gray-600">
                        {t('fileUpload.dropzone')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {t('fileUpload.maxSize', { size: maxSizeMB })}
                    </p>
                </div>
            </div>

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
                <div className="space-y-2">
                    {Object.entries(uploadProgress).map(([fileName, progress]) => (
                        <div key={fileName} className="flex items-center gap-2">
                            <Loader size={16} className="animate-spin text-orange-600" />
                            <div className="flex-1">
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span className="truncate">{fileName}</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-orange-600 transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">{t('fileUpload.uploadedFiles')}</p>
                    {uploadedFiles.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg"
                        >
                            <div className="flex items-center gap-2">
                                <FileIcon size={16} className="text-green-600" />
                                <span className="text-sm text-green-800 truncate">{file.name}</span>
                            </div>
                            <button
                                onClick={() => removeFile(index)}
                                className="p-1 text-green-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
