import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Upload, Image, Check, Loader2, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import JSZip from 'jszip';

const DitheringPanel = () => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selectedResults, setSelectedResults] = useState(new Set());
  const MAX_ZOOM = 5;

  const [selectedAlgorithms, setSelectedAlgorithms] = useState({
    'floyd-steinberg': true,
    'ordered': false,
    'atkinson': false,
    'bayer': false
  });

  // Reset selected results when results change
  useEffect(() => {
    setSelectedResults(new Set(results.map(r => r.id)));
  }, [results]);

  // File handling functions
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files).filter(
      file => file.type.startsWith('image/')
    );
    addFiles(selectedFiles);
  }, []);

  const addFiles = useCallback((newFiles) => {
    setFiles(prevFiles => [
      ...prevFiles,
      ...newFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        status: 'ready',
        progress: {},
        preview: URL.createObjectURL(file)
      }))
    ]);
  }, []);

  const handleRemove = useCallback((fileId) => {
    setFiles(prevFiles => {
      const updatedFiles = prevFiles.filter(f => f.id !== fileId);
      const removedFile = prevFiles.find(f => f.id === fileId);
      if (removedFile?.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      return updatedFiles;
    });
    if (previewImage?.id === fileId) {
      setPreviewImage(null);
    }
  }, [previewImage]);

  // Preview functions
  const handlePreviewImage = useCallback((image, type = 'input') => {
    const currentArray = type === 'input' ? files : results;
    const index = currentArray.findIndex(item => item.id === image.id);
    setPreviewIndex(index);
    setPreviewImage({ ...image, type });
    setZoom(1);
  }, [files, results]);

  const handleNavigatePreview = useCallback((direction) => {
    const currentArray = previewImage.type === 'input' ? files : results;
    const newIndex = (previewIndex + direction + currentArray.length) % currentArray.length;
    const newImage = currentArray[newIndex];
    handlePreviewImage(newImage, previewImage.type);
  }, [previewImage, previewIndex, files, results, handlePreviewImage]);

  const handleZoom = useCallback((delta) => {
    setZoom(prev => Math.max(0.5, Math.min(MAX_ZOOM, prev + delta)));
  }, []);

  // Result handling functions
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

  // Touch handling
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
    setTouchEnd({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  }, []);

  const handleTouchMove = useCallback((e) => {
    setTouchEnd({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          handleNavigatePreview(1);
        } else {
          handleNavigatePreview(-1);
        }
      }
    } else if (Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        handleZoom(0.25);
      } else {
        handleZoom(-0.25);
      }
    }
  }, [touchStart, touchEnd, handleNavigatePreview, handleZoom]);

  // Process images
  const processImages = async () => {
    const algorithms = Object.entries(selectedAlgorithms)
      .filter(([_, selected]) => selected)
      .map(([algo]) => algo);

    if (algorithms.length === 0) {
      alert('Please select at least one algorithm');
      return;
    }

    setProcessing(true);
    const newResults = [];

    try {
      for (const fileData of files) {
        setFiles(prev => prev.map(f => {
          if (f.id === fileData.id) {
            return {
              ...f,
              status: 'processing',
              progress: algorithms.reduce((acc, algo) => ({
                ...acc,
                [algo]: 'processing'
              }), {})
            };
          }
          return f;
        }));

        for (const algorithm of algorithms) {
          const formData = new FormData();
          formData.append('file', fileData.file);
          formData.append('algorithm', algorithm);

          try {
            const response = await fetch('/dither', {
              method: 'POST',
              body: formData
            });

            if (!response.ok) {
              throw new Error(`Failed to process ${fileData.name} with ${algorithm}`);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            newResults.push({
              id: `${fileData.id}-${algorithm}`,
              fileName: fileData.name,
              algorithm,
              url,
              preview: url
            });

            setFiles(prev => prev.map(f => {
              if (f.id === fileData.id) {
                return {
                  ...f,
                  status: 'completed',
                  progress: {
                    ...f.progress,
                    [algorithm]: 'completed'
                  }
                };
              }
              return f;
            }));
          } catch (error) {
            console.error('Error:', error);
            setFiles(prev => prev.map(f => {
              if (f.id === fileData.id) {
                return {
                  ...f,
                  status: 'error',
                  progress: {
                    ...f.progress,
                    [algorithm]: 'error'
                  }
                };
              }
              return f;
            }));
          }
        }
      }
    } finally {
      setProcessing(false);
      setResults(prev => [...prev, ...newResults]);
    }
  };

  const downloadAll = async () => {
    if (selectedResults.size === 0) {
      alert('Please select at least one result to download');
      return;
    }

    const zip = new JSZip();
    
    try {
      const selectedResultsArray = results.filter(result => selectedResults.has(result.id));
      
      for (const result of selectedResultsArray) {
        const response = await fetch(result.url);
        const blob = await response.blob();
        const fileName = `${result.algorithm}_${result.fileName}`;
        zip.file(fileName, blob);
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
      alert('Failed to create ZIP file. Please try downloading images individually.');
    }
  };

  return (
    <>
      <Card className="w-full max-w-3xl mx-auto px-4 sm:px-6">
        <CardHeader className="space-y-2 sm:space-y-4">
          <CardTitle>Image Dithering</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* File Upload Section */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed rounded-lg p-4 sm:p-6 text-center hover:border-gray-400 transition-colors"
          >
            <div className="flex flex-col items-center space-y-4">
              <Upload className="h-8 sm:h-12 w-8 sm:w-12 text-gray-400" />
              <p className="text-base sm:text-lg text-gray-600">
                Drag and drop your images here
              </p>
              <p className="text-sm text-gray-500">or</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                size="sm"
                onClick={() => document.getElementById('file-input').click()}
              >
                Select Images
              </Button>
            </div>
          </div>

          {/* Algorithm Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Dithering Algorithms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(selectedAlgorithms).map(([algo, checked]) => (
                <div key={algo} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg touch-manipulation">
                  <Checkbox
                    id={algo}
                    checked={checked}
                    onCheckedChange={(checked) =>
                      setSelectedAlgorithms(prev => ({
                        ...prev,
                        [algo]: checked === true
                      }))
                    }
                  />
                  <label
                    htmlFor={algo}
                    className="flex-1 text-sm font-medium capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {algo.replace('-', ' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Selected Images</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="bg-gray-50 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center space-x-3">
                      <Image className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-medium flex-1 truncate">
                        {file.name}
                      </span>
                      {file.status === 'processing' && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {file.status === 'completed' && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(file.progress || {}).map(([algo, status]) => (
                        <div
                          key={algo}
                          className="flex items-center space-x-2 text-sm text-gray-600"
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            status === 'completed' ? 'bg-green-500' :
                            status === 'processing' ? 'bg-blue-500' :
                            status === 'error' ? 'bg-red-500' :
                            'bg-gray-300'
                          }`} />
                          <span className="capitalize">{algo.replace('-', ' ')}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handlePreviewImage(file, 'input')}
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemove(file.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Process Button */}
          <Button
            className="w-full"
            size="lg"
            disabled={processing || files.length === 0}
            onClick={processImages}
          >
            {processing ? (
              <span className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing...</span>
              </span>
            ) : (
              'Process Images'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results.length > 0 && (
        <Card className="w-full max-w-3xl mx-auto mt-6 sm:mt-8 px-4 sm:px-6">
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {results.map((result) => (
                <div key={result.id} className="space-y-2">
                  <div className="relative group">
                    <img
                      src={result.url}
                      alt={`${result.algorithm} - ${result.fileName}`}
                      className="w-full rounded-lg shadow-md cursor-pointer"
                      onClick={() => handlePreviewImage(result, 'output')}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded-lg" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedResults.has(result.id)}
                        onCheckedChange={() => toggleResultSelection(result.id)}
                      />
                      <span className="text-sm font-medium capitalize">
                        {result.algorithm.replace('-', ' ')}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      asChild
                    >
                      <a
                        href={result.url}
                        download={`${result.algorithm}_${result.fileName}`}
                        className="flex items-center space-x-2"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        <span>Download</span>
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 space-y-4 sm:space-y-0">
              <span className="text-sm text-gray-600">
                {selectedResults.size} of {results.length} selected
              </span>
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                size="lg"
                onClick={downloadAll}
                disabled={selectedResults.size === 0}
              >
                Download Selected Results (ZIP)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-none w-screen h-screen p-0 bg-black/90">
          <div 
            className="relative w-full h-full flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Semi-transparent control overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-50"
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation Controls */}
            {(previewImage?.type === 'input' ? files.length > 1 : results.length > 1) && (
              <>
                <Button
                  variant="ghost"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-50 touch-manipulation"
                  onClick={() => handleNavigatePreview(-1)}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-50 touch-manipulation"
                  onClick={() => handleNavigatePreview(1)}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Zoom Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-4 z-50">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20 touch-manipulation"
                onClick={() => handleZoom(-0.25)}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20 touch-manipulation"
                onClick={() => handleZoom(0.25)}
                disabled={zoom >= MAX_ZOOM}
              >
                <ZoomIn className="h-6 w-6" />
              </Button>
            </div>

            {/* Image */}
            <div className="h-full w-full flex items-center justify-center overflow-auto p-4 sm:p-8">
              {previewImage && (
                <img
                  src={previewImage.type === 'input' ? previewImage.preview : previewImage.url}
                  alt={previewImage.name}
                  style={{
                    transform: `scale(${zoom})`,
                    transition: 'transform 0.2s',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                  className="select-none touch-manipulation"
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DitheringPanel;
