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
    const currentArray = previewImage.type === 'input' ? files : results;
    const newIndex = (previewIndex + direction + currentArray.length) % currentArray.length;
    const newImage = currentArray[newIndex];
    handlePreviewImage(newImage, previewImage.type);
  };

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.5, Math.min(MAX_ZOOM, prev + delta)));
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

  // Rest of the code remains the same until the Dialog component

  return (
    <>
      {/* Previous JSX remains the same until the Dialog component */}
      
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-none w-screen h-screen p-0 bg-black/90">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Semi-transparent control overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

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

            {/* Top Controls */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-50">
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => handleZoom(0.1)}
                  disabled={zoom >= MAX_ZOOM}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => handleZoom(-0.1)}
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-white/80 text-sm">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {previewImage?.type === 'output' && (
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={() => toggleResultSelection(previewImage.id)}
                  >
                    {selectedResults.has(previewImage.id) ? 'Deselect' : 'Select'}
                  </Button>
                )}
                {previewImage?.type === 'input' && (
                  <Button
                    size="sm"
                    className="bg-red-500/80 hover:bg-red-600/80 text-white"
                    onClick={() => {
                      handleRemove(previewImage.id);
                      setPreviewImage(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => setPreviewImage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
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
