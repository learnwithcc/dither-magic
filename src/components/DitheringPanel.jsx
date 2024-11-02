import React, { useState, useEffect } from 'react';
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
  const MIN_ZOOM = 0.5;
  const ZOOM_STEP = 0.25;

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!previewImage) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          handleNavigatePreview(-1);
          break;
        case 'ArrowRight':
          handleNavigatePreview(1);
          break;
        case 'Escape':
          setPreviewImage(null);
          break;
        case '+':
        case '=':
          handleZoom(ZOOM_STEP);
          break;
        case '-':
        case '_':
          handleZoom(-ZOOM_STEP);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage]);

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(
      file => file.type.startsWith('image/')
    );
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
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
  };

  const handleRemove = (fileId) => {
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
  };

  const handlePreviewImage = (image, type = 'input') => {
    const currentArray = type === 'input' ? files : results;
    const index = currentArray.findIndex(item => item.id === image.id);
    setPreviewIndex(index);
    setPreviewImage({ ...image, type });
    setZoom(1);
  };

  const handleNavigatePreview = (direction) => {
    if (!previewImage) return;
    
    const currentArray = previewImage.type === 'input' ? files : results;
    if (currentArray.length <= 1) return;
    
    const newIndex = (previewIndex + direction + currentArray.length) % currentArray.length;
    const newImage = currentArray[newIndex];
    handlePreviewImage(newImage, previewImage.type);
  };

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
  };

  const toggleResultSelection = (resultId) => {
    setSelectedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };

  // Rest of the component code remains the same until the return statement

  return (
    <>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Image Dithering</CardTitle>
        </CardHeader>
        <CardContent>
          {/* File Upload Section */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
          >
            <div className="flex flex-col items-center space-y-4">
              <Upload className="h-12 w-12 text-gray-400" />
              <p className="text-lg text-gray-600">
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
                size="lg"
                onClick={() => document.getElementById('file-input').click()}
                className="transition-colors hover:bg-secondary/90"
              >
                Select Images
              </Button>
            </div>
          </div>

          {/* Algorithm Selection */}
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Select Dithering Algorithms</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(selectedAlgorithms).map(([algo, checked]) => (
                <div key={algo} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
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
                    className="text-sm font-medium capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {algo.replace('-', ' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold">Selected Images</h3>
              <div className="grid grid-cols-2 gap-4">
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
                        className="transition-colors hover:bg-secondary/90"
                        onClick={() => handlePreviewImage(file, 'input')}
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="transition-colors hover:bg-destructive/90"
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
            className="w-full mt-6 transition-colors hover:bg-primary/90"
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
        <Card className="w-full max-w-3xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {results.map((result) => (
                <div key={result.id} className="space-y-2">
                  <div className="relative group">
                    <img
                      src={result.url}
                      alt={`${result.algorithm} - ${result.fileName}`}
                      className="w-full rounded-lg shadow-md cursor-pointer transition-transform hover:scale-[1.02]"
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
                      className="flex items-center space-x-2 transition-colors hover:bg-secondary/90"
                      asChild
                    >
                      <a
                        href={result.url}
                        download={`${result.algorithm}_${result.fileName}`}
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-6">
              <span className="text-sm text-gray-600">
                {selectedResults.size} of {results.length} selected
              </span>
              <Button
                variant="secondary"
                size="lg"
                className="flex items-center space-x-2 transition-colors hover:bg-secondary/90"
                onClick={downloadAll}
                disabled={selectedResults.size === 0}
              >
                <Download className="h-5 w-5" />
                <span>Download Selected Results (ZIP)</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-none w-screen h-screen p-0 bg-black/90">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Semi-transparent control overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-50"
                  onClick={() => handleNavigatePreview(-1)}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-50"
                  onClick={() => handleNavigatePreview(1)}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Zoom Controls */}
            <div className="absolute left-4 bottom-4 flex items-center space-x-2 z-50">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => handleZoom(-ZOOM_STEP)}
                disabled={zoom <= MIN_ZOOM}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <span className="text-white font-medium">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => handleZoom(ZOOM_STEP)}
                disabled={zoom >= MAX_ZOOM}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
            </div>

            {/* Image */}
            <div className="h-full w-full flex items-center justify-center overflow-auto p-8">
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
                  className="select-none"
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
