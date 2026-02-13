import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUploadFileMutation } from './uploadApi';
import { MAX_UPLOAD_SIZE } from './types';
import { Button } from '@/components/ui/button';
export function UploadZone({ onUploadSuccess }) {
    const [uploadFile, { isLoading, data, error, reset }] = useUploadFileMutation();
    const [rejectionError, setRejectionError] = useState(null);
    const onDrop = useCallback(async (acceptedFiles, fileRejections) => {
        // Clear previous errors
        setRejectionError(null);
        reset();
        // Handle file rejections (client-side validation)
        if (fileRejections.length > 0) {
            const rejection = fileRejections[0];
            if (rejection && rejection.errors.length > 0) {
                const error = rejection.errors[0];
                if (error && error.code === 'file-too-large') {
                    setRejectionError('File too large (max 100MB)');
                }
                else if (error && error.code === 'file-invalid-type') {
                    setRejectionError('Only ZIP files are accepted');
                }
                else if (error) {
                    setRejectionError(error.message);
                }
            }
            return;
        }
        // Upload accepted file
        if (acceptedFiles.length > 0 && acceptedFiles[0]) {
            try {
                const result = await uploadFile(acceptedFiles[0]).unwrap();
                if (onUploadSuccess) {
                    onUploadSuccess(result.projectId);
                }
            }
            catch {
                // Error handled by RTK Query state
            }
        }
    }, [uploadFile, onUploadSuccess, reset]);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/zip': ['.zip'],
        },
        maxSize: MAX_UPLOAD_SIZE,
        multiple: false,
    });
    // Determine display state
    const getDisplayState = () => {
        if (isLoading)
            return 'uploading';
        if (data)
            return 'success';
        if (error || rejectionError)
            return 'error';
        if (isDragActive)
            return 'drag-active';
        return 'idle';
    };
    const displayState = getDisplayState();
    return (_jsxs("div", { className: "w-full max-w-2xl mx-auto", children: [_jsxs("div", { ...getRootProps(), className: `
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${displayState === 'drag-active'
                    ? 'border-primary bg-primary/5'
                    : displayState === 'error'
                        ? 'border-destructive bg-destructive/5'
                        : displayState === 'success'
                            ? 'border-green-500 bg-green-50 dark:bg-green-950'
                            : 'border-muted-foreground/25 hover:border-muted-foreground/50'}
        `, children: [_jsx("input", { ...getInputProps() }), displayState === 'idle' && (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "text-lg font-medium", children: "Drag and drop a ZIP file here, or click to browse" }), _jsxs("div", { className: "text-sm text-muted-foreground space-y-1", children: [_jsx("div", { children: "Max file size: 100MB" }), _jsx("div", { children: "Only .zip files accepted" })] })] })), displayState === 'drag-active' && (_jsx("div", { className: "text-lg font-medium text-primary", children: "Drop your ZIP file here..." })), displayState === 'uploading' && (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "flex items-center justify-center", children: _jsx("div", { className: "animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" }) }), _jsx("div", { className: "text-lg font-medium", children: "Uploading..." })] })), displayState === 'success' && data && (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "flex items-center justify-center", children: _jsx("div", { className: "h-12 w-12 rounded-full bg-green-500 flex items-center justify-center", children: _jsx("svg", { className: "h-8 w-8 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }) }), _jsxs("div", { className: "text-lg font-medium text-green-700 dark:text-green-400", children: ["Upload successful - ", data.fileCount, " files extracted"] }), _jsx("div", { className: "text-sm text-muted-foreground font-mono", children: data.projectId }), _jsx(Button, { onClick: () => reset(), variant: "outline", size: "sm", className: "mt-2", children: "Upload Another" })] })), displayState === 'error' && (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "text-lg font-medium text-destructive", children: "Upload Failed" }), _jsx("div", { className: "text-sm text-muted-foreground", children: rejectionError ||
                                    (error && 'error' in error && typeof error.error === 'string'
                                        ? error.error
                                        : error && 'data' in error && error.data
                                            ? JSON.stringify(error.data)
                                            : 'An error occurred during upload') }), _jsx(Button, { onClick: () => reset(), variant: "outline", size: "sm", className: "mt-2", children: "Try Again" })] }))] }), _jsx("div", { className: "mt-4 text-xs text-center text-muted-foreground", children: "Your files will be processed securely in an isolated environment" })] }));
}
