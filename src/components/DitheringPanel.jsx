import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Upload, Image, Check, Loader2, ZoomIn, ZoomOut, Download, X } from "lucide-react";
import JSZip from 'jszip';

const DitheringPanel = () => {
  const [files, setFiles] = useState([]);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState({
    'floyd-steinberg': true,
    'ordered': false,
    'atkinson': false,
    'bayer': false
  });
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [selectedResults, setSelectedResults] = useState(new Set());
  const MAX_ZOOM = 5;

  const addFiles = useCallback((newFiles) => {
    setFiles(prev => [
      ...prev,
      ...newFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        status: 'ready'
      }))
    ]);
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

  useEffect(() => {
    return () => {
      // Cleanup object URLs when component unmounts
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

    setProcessing(true);
    const newResults = [];

    try {
      for (const fileData of files) {
        for (const algorithm of algorithms) {
          const formData = new FormData();
          formData.append('file', fileData.file);
          formData.append('algorithm', algorithm);

          try {
            const response = await fetch('/dither', {
              method: 'POST',
              body: formData
            });

            if (!response.ok) throw new Error('Processing failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            newResults.push({
              id: `${fileData.id}-${algorithm}`,
              fileName: fileData.name,
              algorithm,
              url
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
            onDragOver={(e) => e.preventDefault()}
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
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(selectedAlgorithms).map(([algo, checked]) => (
              <label key={algo} className="flex items-center space-x-2">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(checked) =>
                    setSelectedAlgorithms(prev => ({...prev, [algo]: checked}))
                  }
                />
                <span className="capitalize">{algo.replace('-', ' ')}</span>
              </label>
            ))}
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
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewImage({ type: 'input', file })}
                  >
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFiles(prev => prev.filter(f => f.id !== file.id))}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Process Button */}
          {files.length > 0 && (
            <Button
              className="w-full"
              disabled={processing || !Object.values(selectedAlgorithms).some(Boolean)}
              onClick={handleProcess}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
              <h3 className="text-lg font-semibold">Results</h3>
              <div className="grid grid-cols-2 gap-4">
                {results.map((result) => (
                  <Card key={result.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm capitalize">{result.algorithm.replace('-', ' ')}</span>
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
                      <img
                        src={result.url}
                        alt={`${result.algorithm} - ${result.fileName}`}
                        className="w-full h-32 object-cover rounded-md cursor-pointer"
                        onClick={() => setPreviewImage({ ...result, type: 'output' })}
                      />
                      <Button
                        className="w-full"
                        onClick={() => handleDownload(result)}
                      >
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
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <div className="relative w-full h-[80vh]">
            <img
              src={previewImage?.type === 'input' 
                ? (previewImage.file.file ? URL.createObjectURL(previewImage.file.file) : '') 
                : previewImage?.url
              }
              alt={previewImage?.type === 'input' ? previewImage.file.name : previewImage?.fileName}
              className="w-full h-full object-contain"
              style={{ transform: `scale(${zoom})` }}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-4">
              <Button
                variant="secondary"
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                onClick={() => setZoom(prev => Math.min(MAX_ZOOM, prev + 0.25))}
                disabled={zoom >= MAX_ZOOM}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              className="absolute top-4 right-4"
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DitheringPanel;
