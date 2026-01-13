import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { buildApiUrl } from '../api/baseUrl';
import { withAuthHeaders } from '../utils/authHeaders';

/**
 * A comprehensive image upload component with:
 * - Drag-and-drop support
 * - Real-time preview showing how the image will be displayed (fit-to-container)
 * - Helpful hints for better image handling
 * - Organization selection support
 * - Existing image selection from library
 */
const ImageUpload = ({
  value,
  onChange,
  organizations = [],
  selectedOrg,
  onOrgChange,
  existingMedia = [],
  label = 'Bild',
  required = false,
  disabled = false,
  showExistingPicker = true,
  showUpload = true,
  aspectRatio = '16/9', // Default aspect ratio for preview
  maxFileSizeMB = 5,
  helpText = '',
  onUploadComplete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [altText, setAltText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mode, setMode] = useState('select'); // 'select' or 'upload'
  const fileInputRef = useRef(null);

  // Resolve the preview URL for the currently selected image
  const selectedImagePreview = useMemo(() => {
    if (!value) return null;
    const media = existingMedia.find((m) => m.id === value);
    if (!media) return null;
    return media.sizes?.thumbnail?.url || media.url || null;
  }, [value, existingMedia]);

  // Get the base URL for media
  const mediaBaseUrl = useMemo(() => {
    try {
      const apiUrl = new URL(buildApiUrl('/'));
      if (apiUrl.pathname.endsWith('/api/') || apiUrl.pathname.endsWith('/api')) {
        apiUrl.pathname = apiUrl.pathname.replace(/\/api\/?$/, '/');
      }
      return apiUrl;
    } catch {
      return null;
    }
  }, []);

  // Resolve a media URL to an absolute URL
  const resolveMediaUrl = useCallback(
    (rawUrl) => {
      if (!rawUrl) return null;
      if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
      if (!mediaBaseUrl) return rawUrl;
      return new URL(rawUrl.replace(/^\//, ''), mediaBaseUrl).toString();
    },
    [mediaBaseUrl],
  );

  // Fetch preview for selected image
  const [fetchedPreview, setFetchedPreview] = useState(null);
  useEffect(() => {
    if (!selectedImagePreview) {
      setFetchedPreview(null);
      return;
    }

    let cancelled = false;
    const fetchPreview = async () => {
      const absoluteUrl = resolveMediaUrl(selectedImagePreview);
      if (!absoluteUrl) return;

      try {
        const response = await fetch(absoluteUrl, {
          credentials: 'include',
          headers: withAuthHeaders(),
        });
        if (!response.ok || cancelled) return;
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setFetchedPreview(objectUrl);
        }
      } catch {
        // Ignore fetch errors for preview
      }
    };

    fetchPreview();
    return () => {
      cancelled = true;
    };
  }, [selectedImagePreview, resolveMediaUrl]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (fetchedPreview) URL.revokeObjectURL(fetchedPreview);
    };
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((file) => {
    setUploadError('');
    setUploadSuccess('');

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Bitte wähle eine Bilddatei aus (JPG, PNG, WebP, GIF).');
      return;
    }

    // Validate file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxFileSizeMB) {
      setUploadError(`Die Datei ist zu groß. Maximal ${maxFileSizeMB} MB erlaubt.`);
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);

    // Auto-generate alt text from filename
    if (!altText) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setAltText(nameWithoutExt);
    }
  }, [altText, maxFileSizeMB, previewUrl]);

  // Handle drag events
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Bitte wähle zuerst eine Datei aus.');
      return;
    }

    if (!altText.trim()) {
      setUploadError('Bitte gib einen Alt-Text an, der das Bild beschreibt.');
      return;
    }

    if (!selectedOrg && organizations.length > 0) {
      setUploadError('Bitte wähle eine Organisation für dieses Bild aus.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('alt', altText.trim());
    if (selectedOrg) {
      formData.append('organization', selectedOrg);
    }

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('alt', altText.trim());
      if (selectedOrg) {
        queryParams.append('organization', selectedOrg);
      }

      const response = await fetch(buildApiUrl(`/api/media?${queryParams.toString()}`), {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: withAuthHeaders(),
      });

      const bodyText = await response.text();
      let parsed = null;
      try {
        parsed = bodyText ? JSON.parse(bodyText) : null;
      } catch {
        parsed = null;
      }

      if (!response.ok) {
        const message = parsed?.errors?.[0]?.message || parsed?.message || bodyText || 'Upload fehlgeschlagen';
        throw new Error(message);
      }

      const created = parsed?.doc ?? parsed ?? null;
      
      if (created?.id) {
        onChange(created.id);
        setUploadSuccess('Bild wurde erfolgreich hochgeladen.');
        onUploadComplete?.(created);
      }

      // Reset form
      setSelectedFile(null);
      setAltText('');
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setMode('select');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  // Clear selection
  const handleClear = () => {
    onChange('');
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setAltText('');
    setUploadError('');
    setUploadSuccess('');
  };

  const displayPreview = mode === 'upload' ? previewUrl : fetchedPreview;
  const selectedMediaInfo = value ? existingMedia.find((m) => m.id === value) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
        {showUpload && showExistingPicker && (
          <div className="flex rounded-md border border-gray-300 text-xs">
            <button
              type="button"
              onClick={() => setMode('select')}
              className={`px-3 py-1 transition-colors ${
                mode === 'select'
                  ? 'bg-[#7CB92C] text-black'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              } rounded-l-md`}
            >
              Aus Bibliothek
            </button>
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`px-3 py-1 transition-colors ${
                mode === 'upload'
                  ? 'bg-[#7CB92C] text-black'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              } rounded-r-md`}
            >
              Neu hochladen
            </button>
          </div>
        )}
      </div>

      {helpText && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}

      {/* Preview Section */}
      {(displayPreview || value) && (
        <div className="space-y-2">
          <div
            className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
            style={{ aspectRatio }}
          >
            {displayPreview ? (
              <img
                src={displayPreview}
                alt={selectedMediaInfo?.alt || altText || 'Bildvorschau'}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Vorschau wird geladen...
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-xs text-white">
                <strong>Vorschau:</strong> So wird das Bild angezeigt (fit-to-container)
              </p>
            </div>
          </div>
          {selectedMediaInfo && (
            <p className="text-xs text-gray-600">
              <strong>Alt-Text:</strong> {selectedMediaInfo.alt || 'Keine Beschreibung'}
            </p>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-red-600 hover:underline"
          >
            Bild entfernen
          </button>
        </div>
      )}

      {/* Upload Error/Success Messages */}
      {uploadError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {uploadError}
        </div>
      )}
      {uploadSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {uploadSuccess}
        </div>
      )}

      {/* Mode: Select from Library */}
      {mode === 'select' && showExistingPicker && !value && (
        <div className="space-y-3">
          {existingMedia.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
              <p className="text-sm text-gray-500">
                Noch keine Bilder in der Bibliothek.
              </p>
              {showUpload && (
                <button
                  type="button"
                  onClick={() => setMode('upload')}
                  className="mt-2 text-sm font-medium text-[#7CB92C] hover:underline"
                >
                  Jetzt ein Bild hochladen
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Grid view for media library */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1">
                {existingMedia.map((item) => {
                  const thumbUrl = resolveMediaUrl(item.sizes?.thumbnail?.url || item.url);
                  const orgName = typeof item.organization === 'object' ? item.organization?.name : null;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onChange(item.id)}
                      disabled={disabled}
                      className="group relative aspect-square overflow-hidden rounded-lg border-2 border-transparent hover:border-[#7CB92C] focus:border-[#7CB92C] focus:outline-none disabled:opacity-50 transition-colors"
                      title={item.alt || item.filename || 'Ohne Beschreibung'}
                    >
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={item.alt || ''}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs text-gray-400">
                          Bild
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      {orgName && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                          <p className="text-[10px] text-white truncate">{orgName}</p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500">
                Klicke auf ein Bild, um es auszuwählen. {existingMedia.length} Bilder verfügbar.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mode: Upload New */}
      {mode === 'upload' && showUpload && !value && (
        <div className="space-y-4">
          {/* Organization Selector */}
          {organizations.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Organisation <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedOrg || ''}
                onChange={(e) => onOrgChange?.(e.target.value)}
                disabled={disabled || organizations.length === 1}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] disabled:opacity-50"
              >
                <option value="">Organisation wählen …</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Das Bild wird dieser Organisation zugeordnet.
              </p>
            </div>
          )}

          {/* Drag & Drop Zone */}
          {!selectedFile && (
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragging
                  ? 'border-[#7CB92C] bg-[#E8F5D9]'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <div className="space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Bild hierher ziehen oder klicken zum Auswählen
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG, WebP oder GIF • Max. {maxFileSizeMB} MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                disabled={disabled}
                className="hidden"
              />
            </div>
          )}

          {/* Selected File Preview & Alt Text */}
          {selectedFile && previewUrl && (
            <div className="space-y-4">
              <div
                className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                style={{ aspectRatio }}
              >
                <img
                  src={previewUrl}
                  alt={altText || 'Vorschau'}
                  className="h-full w-full object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-xs text-white">
                    <strong>Vorschau:</strong> So wird das Bild angezeigt (fit-to-container)
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Alt-Text (Beschreibung) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Was ist auf dem Bild zu sehen?"
                  disabled={disabled}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Der Alt-Text beschreibt das Bild für Screenreader und SEO.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading || disabled}
                  className="rounded-md bg-[#7CB92C] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#5a8b20] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {uploading ? 'Lade hoch …' : 'Bild hochladen'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }
                    setAltText('');
                  }}
                  disabled={uploading}
                  className="text-sm text-gray-600 hover:underline"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Best Practices Hints */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
        <p className="text-xs font-medium text-blue-800">💡 Tipps für bessere Bilder:</p>
        <ul className="mt-1 ml-4 list-disc text-xs text-blue-700 space-y-0.5">
          <li>Verwende Bilder im Querformat (16:9 oder 4:3) für beste Darstellung</li>
          <li>Mindestauflösung: 800x450 Pixel empfohlen</li>
          <li>Helle, gut belichtete Bilder kommen besser zur Geltung</li>
          <li>Beschreibe das Bild im Alt-Text für Barrierefreiheit</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageUpload;
