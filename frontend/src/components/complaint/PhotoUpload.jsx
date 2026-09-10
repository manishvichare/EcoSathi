import { useRef, useState } from 'react';

/**
 * PhotoUpload Component
 * 
 * Provides:
 * - Click to browse files
 * - Drag-and-drop upload
 * - Image preview
 * - File type validation (image only)
 * - File size validation (max 10MB)
 * - Remove/change image
 * 
 * Props:
 * - onPhotoSelect: Callback when photo selected
 * - onPhotoRemove: Callback when photo removed
 * - maxSizeMB: Max file size in MB (default: 10)
 */
export default function PhotoUpload({
  onPhotoSelect,
  onPhotoRemove,
  maxSizeMB = 10,
}) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const MAX_SIZE_BYTES = maxSizeMB * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  /**
   * Validate file
   */
  const validateFile = (file) => {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only PNG, JPG, GIF, and WebP images are allowed');
      return false;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return false;
    }

    return true;
  };

  /**
   * Process file selection
   */
  const processFile = (file) => {
    if (!validateFile(file)) {
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Callback
    onPhotoSelect(file);
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  /**
   * Handle drag
   */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  /**
   * Handle drop
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  /**
   * Remove photo
   */
  const removePhoto = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onPhotoRemove?.();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!preview ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200
            ${
              dragActive
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-300 hover:border-primary-600 hover:bg-gray-50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
            aria-label="Upload complaint photo"
          />

          <div className="space-y-2">
            <div className="text-5xl">📷</div>
            <p className="text-gray-800 font-bold">
              {dragActive
                ? 'Drop your photo here'
                : 'Click to upload or drag and drop'}
            </p>
            <p className="text-gray-600 text-sm">
              PNG, JPG, GIF or WebP • Max {maxSizeMB}MB
            </p>
          </div>
        </div>
      ) : (
        /* Preview */
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            <img
              src={preview}
              alt="Complaint photo preview"
              className="w-full h-64 object-cover"
            />

            {/* Remove Button */}
            <button
              type="button"
              onClick={removePhoto}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors shadow-lg"
              aria-label="Remove photo"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* File Info */}
          <div className="text-sm text-gray-600">
            <p>
              <strong>File:</strong> {selectedFile?.name}
            </p>
            <p>
              <strong>Size:</strong> {(selectedFile?.size / 1024).toFixed(2)} KB
            </p>
          </div>

          {/* Change Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Change Photo
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}