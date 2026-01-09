import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  SplitSquareHorizontal,
  Sliders,
  Grid3X3
} from "lucide-react";
import ComparisonSlider from '@/components/ui/comparison-slider';
import StepProgress from '@/components/ui/step-progress';
import AlgorithmPresets from '@/components/ui/algorithm-presets';
import CollapsibleSection from '@/components/ui/collapsible-section';
import FocusModeToggle, { FocusModeInfo } from '@/components/ui/focus-mode-toggle';
import JSZip from 'jszip';
import PaletteSelector, { parseHexColors } from './PaletteSelector';

/**
 * Map of algorithm identifiers to their corresponding icon paths.
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
 * All available algorithms
 */
const ALL_ALGORITHMS = [
  'floyd-steinberg', 'ordered', 'atkinson', 'bayer',
  'stucki', 'jarvis', 'burkes', 'sierra',
  'sierra-two-row', 'sierra-lite', 'halftone', 'blue-noise'
];

/**
 * Main dithering panel component with ADHD-friendly UX.
 *
 * Features:
 * - Step-by-step progress indicator
 * - Algorithm presets for quick start
 * - Progressive disclosure of advanced options
 * - Focus mode for reduced distractions
 * - Clear visual feedback
 */
const DitheringPanel = () => {
  const [files, setFiles] = useState([]);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState(() => {
    const saved = localStorage.getItem('selectedAlgorithms');
    const defaults = Object.fromEntries(
      ALL_ALGORITHMS.map(algo => [algo, algo === 'floyd-steinberg'])
    );
    if (saved) {
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

  // ADHD-friendly UI state
  const [focusMode, setFocusMode] = useState(() => {
    return localStorage.getItem('focusMode') === 'true';
  });
  const [activePreset, setActivePreset] = useState(() => {
    return localStorage.getItem('activePreset') || 'classic';
  });

  // Calculate current step based on state
  const currentStep = useMemo(() => {
    if (results.length > 0) return 4;
    if (processing) return 3;
    if (files.length > 0 && Object.values(selectedAlgorithms).some(Boolean)) return 2;
    if (files.length > 0) return 2;
    return 1;
  }, [files.length, selectedAlgorithms, processing, results.length]);

  const selectedAlgorithmCount = useMemo(() => {
    return Object.values(selectedAlgorithms).filter(Boolean).length;
  }, [selectedAlgorithms]);

  // Persist focus mode and preset
  useEffect(() => {
    localStorage.setItem('focusMode', focusMode);
  }, [focusMode]);

  useEffect(() => {
    localStorage.setItem('activePreset', activePreset);
  }, [activePreset]);

  /**
   * Adds new image files to the upload queue.
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

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

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

  /**
   * Handle preset selection
   */
  const handlePresetSelect = (presetId, algorithms) => {
    setActivePreset(presetId);

    if (algorithms) {
      // Set only the selected algorithms
      const newState = Object.fromEntries(
        ALL_ALGORITHMS.map(algo => [algo, algorithms.includes(algo)])
      );
      setSelectedAlgorithms(newState);
      localStorage.setItem('selectedAlgorithms', JSON.stringify(newState));
    }
  };

  const handleProcess = async () => {
    const algorithms = Object.entries(selectedAlgorithms)
      .filter(([_, selected]) => selected)
      .map(([algo]) => algo);

    if (algorithms.length === 0) {
      alert('Please select at least one algorithm');
      return;
    }

    const customColors = parseHexColors(customPalette);
    const useCustomPalette = customColors.length >= 2;

    setProcessing(true);
    const newResults = [];

    try {
      for (const fileData of files) {
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

            const paletteName = useCustomPalette
              ? 'Custom'
              : palettes.find(p => p.id === selectedPalette)?.name || selectedPalette;

            newResults.push({
              id: `${fileData.id}-${algorithm}-${selectedPalette}`,
              fileName: fileData.name,
              algorithm,
              palette: paletteName,
              url,
              originalUrl
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
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Image Dithering</CardTitle>
            <FocusModeToggle
              enabled={focusMode}
              onToggle={() => setFocusMode(!focusMode)}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Indicator */}
          <StepProgress
            currentStep={currentStep}
            hasFiles={files.length > 0}
            hasAlgorithms={selectedAlgorithmCount > 0}
            isProcessing={processing}
            hasResults={results.length > 0}
          />

          {/* Focus Mode Info */}
          <FocusModeInfo enabled={focusMode} />

          {/* File Upload Section */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200"
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
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <Button
                  variant="default"
                  size="lg"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8"
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

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">
                  {files.length} image{files.length > 1 ? 's' : ''} ready
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setFiles([])}
                >
                  Clear all
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="relative group bg-gray-100 rounded-lg p-2 flex items-center gap-2"
                  >
                    <div className="w-10 h-10 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                      <img
                        src={URL.createObjectURL(file.file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs truncate flex-1">{file.name}</span>
                    <button
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      onClick={() => setFiles(prev => prev.filter(f => f.id !== file.id))}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Algorithm Presets - Always visible */}
          <AlgorithmPresets
            onSelectPreset={handlePresetSelect}
            onSelectPalette={setSelectedPalette}
            activePreset={activePreset}
          />

          {/* Advanced Options - Collapsible in Focus Mode */}
          {!focusMode && (
            <>
              {/* Individual Algorithm Selection */}
              <CollapsibleSection
                title="Fine-tune Algorithms"
                description="Select specific algorithms individually"
                icon={Sliders}
                badge={`${selectedAlgorithmCount} selected`}
                defaultOpen={activePreset === 'custom'}
              >
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActivePreset('custom');
                        const allChecked = Object.values(selectedAlgorithms).every(Boolean);
                        const newState = Object.fromEntries(
                          ALL_ALGORITHMS.map(algo => [algo, !allChecked])
                        );
                        setSelectedAlgorithms(newState);
                        localStorage.setItem('selectedAlgorithms', JSON.stringify(newState));
                      }}
                    >
                      {Object.values(selectedAlgorithms).every(Boolean) ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {ALL_ALGORITHMS.map((algo) => (
                      <label
                        key={algo}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedAlgorithms[algo]}
                          onCheckedChange={(checked) => {
                            setActivePreset('custom');
                            setSelectedAlgorithms(prev => {
                              const newState = {...prev, [algo]: checked};
                              localStorage.setItem('selectedAlgorithms', JSON.stringify(newState));
                              return newState;
                            });
                          }}
                        />
                        <img
                          src={algorithmIcons[algo]}
                          alt={`${algo} pattern`}
                          className="w-6 h-6"
                        />
                        <span className="capitalize text-sm">{algo.replace(/-/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CollapsibleSection>

              {/* Color Palette Selection */}
              <CollapsibleSection
                title="Color Palette"
                description="Choose colors for your dithered images"
                icon={Palette}
                defaultOpen={selectedPalette !== 'bw'}
              >
                <PaletteSelector
                  palettes={palettes}
                  selectedPalette={selectedPalette}
                  onSelect={setSelectedPalette}
                  customPalette={customPalette}
                  onCustomPaletteChange={setCustomPalette}
                />
              </CollapsibleSection>
            </>
          )}

          {/* Quick Palette Selection for Focus Mode */}
          {focusMode && (
            <div className="flex items-center gap-2 justify-center">
              <span className="text-sm text-gray-500">Palette:</span>
              <select
                value={selectedPalette}
                onChange={(e) => setSelectedPalette(e.target.value)}
                className="text-sm border rounded-lg px-3 py-1.5 bg-white"
              >
                <option value="bw">Black & White</option>
                <option value="gameboy">Game Boy</option>
                <option value="sepia">Sepia</option>
              </select>
            </div>
          )}

          {/* Process Button */}
          {files.length > 0 && (
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-6 text-lg rounded-xl shadow-lg shadow-blue-200 transition-all duration-200"
              disabled={processing || selectedAlgorithmCount === 0}
              onClick={handleProcess}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Process {files.length} Image{files.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}

          {/* Results Section */}
          {results.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Results
                  <span className="text-sm font-normal text-gray-500">
                    ({results.length} images)
                  </span>
                </h3>
                <div className="flex gap-2">
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
              </div>

              {/* Quick Compare Tip */}
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 flex items-center gap-3">
                <SplitSquareHorizontal className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <p className="text-sm text-purple-700">
                  <strong>Tip:</strong> Click the compare icon on any result to see before/after side-by-side
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {results.map((result) => (
                  <Card key={result.id} className="overflow-hidden">
                    <div className="relative">
                      <img
                        src={result.url}
                        alt={`${result.algorithm} - ${result.fileName}`}
                        className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setPreviewImage({ ...result, type: 'output' })}
                      />

                      {/* Quick compare button - prominent */}
                      <Button
                        variant="default"
                        size="sm"
                        className="absolute top-2 right-2 bg-purple-500 hover:bg-purple-600 text-white h-8 px-2 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage({ ...result, type: 'output' });
                          setComparisonMode(true);
                        }}
                        title="Compare with original"
                      >
                        <SplitSquareHorizontal className="h-4 w-4" />
                        <span className="text-xs">Compare</span>
                      </Button>

                      {/* Selection checkbox */}
                      <button
                        className={`absolute top-2 left-2 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                          selectedResults.has(result.id)
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'bg-white/80 border-gray-300 hover:border-blue-400'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleResultSelection(result.id);
                        }}
                      >
                        {selectedResults.has(result.id) && <Check className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="p-3 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium capitalize">
                          {result.algorithm.replace(/-/g, ' ')}
                        </span>
                        {result.palette && (
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {result.palette}
                          </span>
                        )}
                      </div>
                      <Button
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                        size="sm"
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
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4"
                  onClick={handleBatchDownload}
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download {selectedResults.size} Selected Images
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
            {/* Toggle button for comparison mode */}
            {previewImage?.type === 'output' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                <Button
                  variant={comparisonMode ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setComparisonMode(!comparisonMode)}
                  className={comparisonMode
                    ? "bg-purple-500 hover:bg-purple-600 text-white"
                    : "bg-white/90 hover:bg-white"
                  }
                >
                  <SplitSquareHorizontal className="w-4 h-4 mr-2" />
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

            {/* Navigation controls */}
            {!comparisonMode && (
              <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                <Button
                  variant="ghost"
                  size="icon"
                  className="pointer-events-auto bg-black/20 hover:bg-black/40"
                  onClick={() => handleNavigatePrev()}
                >
                  <ChevronLeft className="h-8 w-8 text-white" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="pointer-events-auto bg-black/20 hover:bg-black/40"
                  onClick={() => handleNavigateNext()}
                >
                  <ChevronRight className="h-8 w-8 text-white" />
                </Button>
              </div>
            )}

            {/* Zoom controls */}
            {!comparisonMode && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-4 bg-black/40 p-2 rounded-lg">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-white min-w-[4rem] text-center">{Math.round(zoom * 100)}%</span>
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

            {/* Keyboard hint */}
            <div className="absolute bottom-4 right-4 text-white/60 text-xs bg-black/30 px-3 py-1.5 rounded">
              Press <kbd className="bg-white/20 px-1.5 py-0.5 rounded">C</kbd> to compare
              {!comparisonMode && <> &bull; <kbd className="bg-white/20 px-1.5 py-0.5 rounded">←</kbd><kbd className="bg-white/20 px-1.5 py-0.5 rounded">→</kbd> to navigate</>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Import Sparkles for the process button
const Sparkles = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
);

export default DitheringPanel;
