import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Upload,
  Image,
  Check,
  Loader2,
  ZoomIn,
  ZoomOut,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Palette,
  SplitSquareHorizontal
} from "lucide-react";
import ComparisonSlider from '@/components/ui/comparison-slider';
import JSZip from 'jszip';
import PaletteSelector, { parseHexColors } from './PaletteSelector';

/**
 * Map of algorithm identifiers to their corresponding icon paths.
 * @type {Object.<string, string>}
 */
const algorithmIcons = {
  'floyd-steinberg': '/static/img/algorithms/floyd-steinberg.svg',
  'ordered': '/static/img/algorithms/ordered.svg',
  'atkinson': '/static/img/algorithms/atkinson.svg',
  'bayer': '/static/img/algorithms/bayer.svg',
  'stucki': '/static/img/algorithms/stucki.svg',
  'jarvis': '/static/img/algorithms/jarvis.svg',
  'burkes': '/static/img/algorithms/burkes.svg',
  'sierra': '/static/img/algorithms/sierra.svg',
  'sierra-two-row': '/static/img/algorithms/sierra-two-row.svg',
  'sierra-lite': '/static/img/algorithms/sierra-lite.svg',
  'halftone': '/static/img/algorithms/halftone.svg',
  'blue-noise': '/static/img/algorithms/blue-noise.svg'
};

/**
 * Main dithering panel component for the application.
 *
 * Provides a complete interface for:
 * - Uploading multiple images via file input or drag-and-drop
 * - Selecting one or more dithering algorithms
 * - Batch processing images with selected algorithms
 * - Previewing input and output images with zoom controls
 * - Downloading individual results or multiple results as a ZIP file
 *
 * State persists algorithm selection in localStorage for user convenience.
 *
 * @component
 * @returns {React.Element} The dithering panel interface
 */
const DitheringPanel = () => {
  const [files, setFiles] = useState([]);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState(() => {
    const saved = localStorage.getItem('selectedAlgorithms');
    // Default algorithms with new ones included
    const defaults = {
      'floyd-steinberg': true,
      'ordered': false,
      'atkinson': false,
      'bayer': false,
      'stucki': false,
      'jarvis': false,
      'burkes': false,
      'sierra': false,
      'sierra-two-row': false,
      'sierra-lite': false,
      'halftone': false,
      'blue-noise': false
    };
    if (saved) {
      // Merge saved with defaults to ensure new algorithms are included
      const parsed = JSON.parse(saved);
      return { ...defaults, ...parsed };
    }
    return defaults;
  });
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [selectedResults, setSelectedResults] = useState(new Set());
  const [comparisonMode, setComparisonMode] = useState(false);
  const MAX_ZOOM = 5;

  // Palette state
  const [palettes, setPalettes] = useState([]);
  const [selectedPalette, setSelectedPalette] = useState(() => {
    return localStorage.getItem('selectedPalette') || 'bw';
  });
  const [customPalette, setCustomPalette] = useState('');

  /**
   * Adds new image files to the upload queue.
   * Filters for image files only and assigns unique IDs.
   *
   * @param {FileList|File[]} newFiles - Files to add to the queue
   */
  const addFiles = useCallback((newFiles) => {
    const imageFiles = Array.from(newFiles).filter(
      file => file.type.startsWith('image/')
    );
    setFiles(prev => [
      ...prev,
      ...imageFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        status: 'ready'
      }))
    ]);
  }, []);

  /**
   * Handles drag over event for file drag-and-drop.
   * Prevents default behavior to allow drop.
   *
   * @param {DragEvent} e - The drag event
   */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * Handles file drop event for drag-and-drop upload.
   * Filters for image files and adds them to the queue.
   *
   * @param {DragEvent} e - The drop event
   */
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  }, [addFiles]);

  // Fetch palettes on mount
  useEffect(() => {
    fetch('/api/palettes')
      .then(res => res.json())
      .then(setPalettes)
      .catch(console.error);
  }, []);

  // Persist palette selection
  useEffect(() => {
    localStorage.setItem('selectedPalette', selectedPalette);
  }, [selectedPalette]);

  const handleNavigatePrev = () => {
    if (!previewImage) return;
    
    const items = previewImage.type === 'input' ? files : results;
    const currentIndex = items.findIndex(item => 
      previewImage.type === 'input' 
        ? item.id === previewImage.file.id
        : item.id === previewImage.id
    );
    
    if (currentIndex > 0) {
      const prevItem = items[currentIndex - 1];
      setPreviewImage(
        previewImage.type === 'input'
          ? { type: 'input', file: prevItem }
          : { ...prevItem, type: 'output' }
      );
    }
  };

  const handleNavigateNext = () => {
    if (!previewImage) return;
    
    const items = previewImage.type === 'input' ? files : results;
    const currentIndex = items.findIndex(item => 
      previewImage.type === 'input' 
        ? item.id === previewImage.file.id
        : item.id === previewImage.id
    );
    
    if (currentIndex < items.length - 1) {
      const nextItem = items[currentIndex + 1];
      setPreviewImage(
        previewImage.type === 'input'
          ? { type: 'input', file: nextItem }
          : { ...nextItem, type: 'output' }
      );
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!previewImage) return;

      switch(e.key) {
        case 'ArrowLeft':
          if (!comparisonMode) handleNavigatePrev();
          break;
        case 'ArrowRight':
          if (!comparisonMode) handleNavigateNext();
          break;
        case 'Escape':
          if (comparisonMode) {
            setComparisonMode(false);
          } else {
            setPreviewImage(null);
          }
          break;
        case 'c':
        case 'C':
          // Toggle comparison mode with 'C' key (only for output images)
          if (previewImage?.type === 'output') {
            setComparisonMode(!comparisonMode);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage, comparisonMode]);

  useEffect(() => {
    return () => {
      if (previewImage?.type === 'input' && previewImage.file.file) {
        URL.revokeObjectURL(URL.createObjectURL(previewImage.file.file));
      }
    };
  }, [previewImage]);

  const handleProcess = async () => {
    const algorithms = Object.entries(selectedAlgorithms)
      .filter(([_, selected]) => selected)
      .map(([algo]) => algo);

    if (algorithms.length === 0) {
      alert('Please select at least one algorithm');
      return;
    }

    // Parse custom palette if provided
    const customColors = parseHexColors(customPalette);
    const useCustomPalette = customColors.length >= 2;

    setProcessing(true);
    const newResults = [];

    try {
      for (const fileData of files) {
        // Create URL for original image once per file
        const originalUrl = URL.createObjectURL(fileData.file);

        for (const algorithm of algorithms) {
          const formData = new FormData();
          formData.append('file', fileData.file);
          formData.append('algorithm', algorithm);
          formData.append('palette', selectedPalette);

          if (useCustomPalette) {
            formData.append('custom_palette', JSON.stringify(customColors));
          }

          try {
            const response = await fetch('/dither', {
              method: 'POST',
              body: formData
            });

            if (!response.ok) throw new Error('Processing failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            // Get palette name for display
            const paletteName = useCustomPalette
              ? 'Custom'
              : palettes.find(p => p.id === selectedPalette)?.name || selectedPalette;

            newResults.push({
              id: `${fileData.id}-${algorithm}-${selectedPalette}`,
              fileName: fileData.name,
              algorithm,
              palette: paletteName,
              url,
              originalUrl  // Store reference to original image
            });
          } catch (error) {
            console.error('Error processing file:', error);
          }
        }
      }

      setResults(prev => [...prev, ...newResults]);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = useCallback((result) => {
    const link = document.createElement('a');
    link.href = result.url;
    link.download = `${result.algorithm}_${result.fileName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleBatchDownload = async () => {
    if (selectedResults.size === 0) return;

    const zip = new JSZip();
    const selectedResultsArray = results.filter(result => selectedResults.has(result.id));

    try {
      for (const result of selectedResultsArray) {
        const response = await fetch(result.url);
        const blob = await response.blob();
        zip.file(`${result.algorithm}_${result.fileName}`, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dithered_images.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating ZIP:', error);
      alert('Failed to create ZIP file');
    }
  };

  const toggleResultSelection = useCallback((resultId) => {
    setSelectedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  }, []);

  return (
    <>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Image Dithering</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Section */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
          >
            <input
              type="file"
              id="file-input"
              className="hidden"
              multiple
              accept="image/*"
              onChange={(e) => addFiles(Array.from(e.target.files))}
            />
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <Button
                  variant="default"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => document.getElementById('file-input').click()}
                >
                  Select Images
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                or drag and drop your images here
              </p>
            </div>
          </div>

          {/* Algorithm Selection */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Select Algorithms</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allChecked = Object.values(selectedAlgorithms).every(Boolean);
                  setSelectedAlgorithms(prev => {
                    const newState = {};
                    Object.keys(prev).forEach(key => {
                      newState[key] = !allChecked;
                    });
                    localStorage.setItem('selectedAlgorithms', JSON.stringify(newState));
                    return newState;
                  });
                }}
              >
                {Object.values(selectedAlgorithms).every(Boolean) ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(selectedAlgorithms).map(([algo, checked]) => (
                <label key={algo} className="flex items-center space-x-3">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(checked) =>
                      setSelectedAlgorithms(prev => {
                        const newState = {...prev, [algo]: checked};
                        localStorage.setItem('selectedAlgorithms', JSON.stringify(newState));
                        return newState;
                      })
                    }
                  />
                  <img
                    src={algorithmIcons[algo]}
                    alt={`${algo} pattern`}
                    className="w-6 h-6"
                  />
                  <span className="capitalize">{algo.replace('-', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Color Palette Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-semibold">Color Palette</h3>
            </div>
            <PaletteSelector
              palettes={palettes}
              selectedPalette={selectedPalette}
              onSelect={setSelectedPalette}
              customPalette={customPalette}
              onCustomPaletteChange={setCustomPalette}
            />
          </div>

          {/* File List */}
          <div className="grid grid-cols-2 gap-4">
            {files.map((file) => (
              <Card key={file.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-green-500">🟢 Ready</span>
                </div>
                <div className="mt-2 flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 bg-gray-100 hover:bg-gray-200"
                    onClick={() => setPreviewImage({ type: 'input', file })}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => setFiles(prev => prev.filter(f => f.id !== file.id))}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Process Button */}
          {files.length > 0 && (
            <Button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 text-lg"
              disabled={processing || !Object.values(selectedAlgorithms).some(Boolean)}
              onClick={handleProcess}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process Images'
              )}
            </Button>
          )}

          {/* Results Section */}
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Results</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allSelected = results.every(result => selectedResults.has(result.id));
                    if (allSelected) {
                      setSelectedResults(new Set());
                    } else {
                      setSelectedResults(new Set(results.map(result => result.id)));
                    }
                  }}
                >
                  {results.every(result => selectedResults.has(result.id)) ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {results.map((result) => (
                  <Card key={result.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm capitalize">{result.algorithm.replace('-', ' ')}</span>
                          {result.palette && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {result.palette}
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleResultSelection(result.id)}
                        >
                          {selectedResults.has(result.id) ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            'Select'
                          )}
                        </Button>
                      </div>
                      <div className="relative">
                        <img
                          src={result.url}
                          alt={`${result.algorithm} - ${result.fileName}`}
                          className="w-full h-32 object-cover rounded-md cursor-pointer"
                          onClick={() => setPreviewImage({ ...result, type: 'output' })}
                        />
                        {/* Quick compare button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage({ ...result, type: 'output' });
                            setComparisonMode(true);
                          }}
                          title="Compare with original"
                        >
                          <SplitSquareHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={() => handleDownload(result)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              {selectedResults.size > 0 && (
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white mt-4"
                  onClick={handleBatchDownload}
                >
                  Download All Selected ({selectedResults.size})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => {
        setPreviewImage(null);
        setComparisonMode(false);
      }}>
        <DialogContent className="fixed inset-0 flex items-center justify-center bg-black/50 p-0">
          <DialogTitle className="sr-only">
            {previewImage?.type === 'input' ? 'Original Image' : 'Dithered Image'} Preview
          </DialogTitle>

          <div className="relative w-full h-full max-w-5xl max-h-[90vh] mx-auto flex flex-col">
            {/* Toggle button for comparison mode (only show for output images) */}
            {previewImage?.type === 'output' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setComparisonMode(!comparisonMode)}
                  className="bg-white/90 hover:bg-white"
                >
                  {comparisonMode ? 'Exit Comparison' : 'Compare with Original'}
                </Button>
              </div>
            )}

            {/* Image display area */}
            <div className="flex-1 flex items-center justify-center p-4">
              {comparisonMode && previewImage?.type === 'output' ? (
                <ComparisonSlider
                  originalSrc={previewImage.originalUrl}
                  processedSrc={previewImage.url}
                  originalAlt={`Original: ${previewImage.fileName}`}
                  processedAlt={`${previewImage.algorithm}: ${previewImage.fileName}`}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <img
                  src={previewImage?.type === 'input'
                    ? URL.createObjectURL(previewImage.file.file)
                    : previewImage?.url
                  }
                  alt={previewImage?.type === 'input' ? previewImage.file.name : previewImage?.fileName}
                  className="max-w-full max-h-full object-contain"
                  style={{ transform: `scale(${zoom})` }}
                />
              )}
            </div>

            {/* Navigation controls (hide in comparison mode) */}
            {!comparisonMode && (
              <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                <Button
                  variant="ghost"
                  size="icon"
                  className="pointer-events-auto"
                  onClick={() => handleNavigatePrev()}
                >
                  <ChevronLeft className="h-8 w-8 text-white" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="pointer-events-auto"
                  onClick={() => handleNavigateNext()}
                >
                  <ChevronRight className="h-8 w-8 text-white" />
                </Button>
              </div>
            )}

            {/* Zoom controls (hide in comparison mode) */}
            {!comparisonMode && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-4 bg-black/20 p-2 rounded-lg">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-white">{Math.round(zoom * 100)}%</span>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setZoom(prev => Math.min(MAX_ZOOM, prev + 0.25))}
                  disabled={zoom >= MAX_ZOOM}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DitheringPanel;