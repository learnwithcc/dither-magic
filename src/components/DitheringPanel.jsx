import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Upload, Image, Check, Loader2 } from "lucide-react";

const DitheringPanel = () => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);

  const [selectedAlgorithms, setSelectedAlgorithms] = useState({
    'floyd-steinberg': true,
    'ordered': false,
    'atkinson': false,
    'bayer': false
  });

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );
    setFiles(prevFiles => [
      ...prevFiles,
      ...droppedFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        status: 'ready',
        progress: {},
      }))
    ]);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(
      file => file.type.startsWith('image/')
    );
    setFiles(prevFiles => [
      ...prevFiles,
      ...selectedFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        status: 'ready',
        progress: {},
      }))
    ]);
  };

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
        for (const algorithm of algorithms) {
          const formData = new FormData();
          formData.append('file', fileData.file);
          formData.append('algorithm', algorithm);

          setFiles(prev => prev.map(f => {
            if (f.id === fileData.id) {
              return {
                ...f,
                status: 'processing',
                progress: {
                  ...f.progress,
                  [algorithm]: 'processing'
                }
              };
            }
            return f;
          }));

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
              url
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
    const zip = new JSZip();
    
    results.forEach(result => {
      const fileName = `${result.algorithm}_${result.fileName}`;
      zip.file(fileName, fetch(result.url).then(r => r.blob()));
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dithered_images.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Batch Image Dithering</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-3 border-dashed border-gray-300 rounded-lg p-12 text-center space-y-6 transition-colors hover:border-gray-400 hover:bg-gray-50"
        >
          <div className="flex flex-col items-center space-y-4">
            <Upload className="h-16 w-16 text-gray-400" />
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
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
              onClick={() => document.getElementById('file-input').click()}
            >
              Select Images
            </Button>
          </div>
        </div>

        {files.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Selected Images</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
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
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4 pt-6 border-t border-gray-200">
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
                      [algo]: checked
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

        <Button
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 text-lg shadow-md hover:shadow-lg transition-all"
          onClick={processImages}
          disabled={processing || files.length === 0}
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

        {results.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Results</h3>
            <div className="grid grid-cols-2 gap-6">
              {results.map((result) => (
                <div key={result.id} className="space-y-2">
                  <img
                    src={result.url}
                    alt={`${result.algorithm} - ${result.fileName}`}
                    className="w-full rounded-lg shadow-md"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">
                      {result.algorithm.replace('-', ' ')}
                    </span>
                    <a
                      href={result.url}
                      download={`${result.algorithm}_${result.fileName}`}
                      className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={downloadAll}
            >
              Download All (ZIP)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DitheringPanel;