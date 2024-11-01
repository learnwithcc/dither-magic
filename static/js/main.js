document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const dragDropZone = document.getElementById('drag-drop-zone');
    const fileList = document.getElementById('file-list');
    const resultsGrid = document.getElementById('results-grid');
    const batchDownload = document.getElementById('batch-download');
    const submitButton = form.querySelector('button[type="submit"]');

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    let totalFiles = 0;
    let processedFiles = 0;
    let processingTimeout;

    // Drag and drop handlers
    dragDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dragDropZone.classList.add('dragover');
    });

    dragDropZone.addEventListener('dragleave', () => {
        dragDropZone.classList.remove('dragover');
    });

    dragDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dragDropZone.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(file => 
            ALLOWED_TYPES.includes(file.type));
        if (files.length === 0) {
            showError('Please drop only supported image files (JPEG, PNG, GIF, WebP)');
            return;
        }
        const dt = new DataTransfer();
        files.forEach(file => dt.items.add(file));
        fileInput.files = dt.files;
        updateFileList();
    });

    fileInput.addEventListener('change', updateFileList);

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message mb-4';
        errorDiv.textContent = message;
        form.insertBefore(errorDiv, form.firstChild);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    function updateFileList() {
        fileList.innerHTML = '';
        Array.from(fileInput.files).forEach(file => {
            if (!ALLOWED_TYPES.includes(file.type)) {
                showError(`${file.name} is not a supported image type. Please use JPEG, PNG, GIF, or WebP.`);
                return;
            }
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item mb-2';
            fileItem.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-sm">${file.name}</span>
                    <span class="text-xs text-gray-500 processing-status">Waiting...</span>
                </div>
                <div class="progress-bar mt-1">
                    <div class="progress-bar-fill" style="width: 0%"></div>
                </div>
            `;
            fileList.appendChild(fileItem);
        });
    }

    async function processFile(file, algorithm, fileItem) {
        const statusElement = fileItem.querySelector('.processing-status');
        const progressBar = fileItem.querySelector('.progress-bar-fill');
        
        try {
            statusElement.textContent = `Processing with ${algorithm}...`;
            progressBar.style.width = '50%';

            const formData = new FormData();
            formData.append('file', file);
            formData.append('algorithm', algorithm);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const response = await fetch('/dither', {
                method: 'POST',
                body: formData,
                signal: controller.signal
            }).finally(() => clearTimeout(timeoutId));

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to process image');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.innerHTML = `
                <h3 class="font-bold mb-2">${file.name} - ${algorithm}</h3>
                <img src="${url}" alt="Dithered image" class="mb-2">
                <a href="${url}" download="${algorithm}_${file.name}" 
                   class="inline-block bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded">
                    Download
                </a>
            `;
            resultsGrid.appendChild(resultCard);
            progressBar.style.width = '100%';
            statusElement.textContent = 'Completed';
            return { url, filename: `${algorithm}_${file.name}`, blob };
        } catch (error) {
            console.error('Error processing file:', error);
            progressBar.style.width = '100%';
            progressBar.style.backgroundColor = '#ef4444';
            statusElement.textContent = 'Failed';
            statusElement.classList.add('text-red-500');
            
            const errorCard = document.createElement('div');
            errorCard.className = 'result-card bg-red-50';
            errorCard.innerHTML = `
                <h3 class="font-bold mb-2">${file.name} - ${algorithm}</h3>
                <p class="text-red-500">Error: ${error.message}</p>
            `;
            resultsGrid.appendChild(errorCard);
            throw error;
        } finally {
            processedFiles++;
            updateOverallProgress();
        }
    }

    async function downloadWithDelay(results) {
        const batchButton = batchDownload.querySelector('button');
        const originalText = batchButton.textContent;
        let downloaded = 0;

        try {
            batchButton.disabled = true;
            for (const result of results) {
                try {
                    const link = document.createElement('a');
                    link.href = result.url;
                    link.download = result.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    downloaded++;
                    
                    const progress = Math.round((downloaded / results.length) * 100);
                    batchButton.textContent = `Downloading... ${progress}%`;
                    
                    await new Promise(resolve => setTimeout(resolve, 800));
                } catch (error) {
                    console.error('Download failed:', error);
                    showError(`Failed to download ${result.filename}`);
                }
            }
        } finally {
            batchButton.disabled = false;
            batchButton.textContent = originalText;
        }
    }

    function updateOverallProgress() {
        const progress = (processedFiles / totalFiles) * 100;
        submitButton.textContent = `Processing... ${Math.round(progress)}%`;
        
        if (processedFiles === totalFiles) {
            submitButton.textContent = 'Process Images';
            submitButton.disabled = false;
            form.classList.remove('loading');
            clearTimeout(processingTimeout);
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const selectedAlgorithms = Array.from(form.querySelectorAll('input[name="algorithms"]:checked'))
            .map(input => input.value);
        
        if (selectedAlgorithms.length === 0) {
            showError('Please select at least one dithering algorithm');
            return;
        }

        const files = Array.from(fileInput.files);
        if (files.length === 0) {
            showError('Please select at least one image');
            return;
        }

        // Reset state
        resultsGrid.innerHTML = '';
        batchDownload.classList.add('hidden');
        submitButton.disabled = true;
        form.classList.add('loading');
        
        totalFiles = files.length * selectedAlgorithms.length;
        processedFiles = 0;
        const results = [];

        // Set a timeout for the entire batch processing
        processingTimeout = setTimeout(() => {
            if (processedFiles < totalFiles) {
                showError('Processing is taking longer than expected. Please try with fewer images or algorithms.');
                submitButton.textContent = 'Process Images';
                submitButton.disabled = false;
                form.classList.remove('loading');
            }
        }, 120000); // 2 minutes timeout for batch processing

        try {
            for (let file of files) {
                const fileItem = Array.from(fileList.children)
                    .find(item => item.querySelector('span').textContent === file.name);

                await Promise.all(selectedAlgorithms.map(async (algorithm) => {
                    try {
                        const result = await processFile(file, algorithm, fileItem);
                        results.push(result);
                    } catch (error) {
                        console.error(`Failed to process ${file.name} with ${algorithm}:`, error);
                    }
                }));
            }
        } catch (error) {
            showError('An error occurred during batch processing');
            console.error('Batch processing error:', error);
        } finally {
            if (results.length > 0) {
                batchDownload.classList.remove('hidden');
                batchDownload.querySelector('button').onclick = () => downloadWithDelay(results);
            }
        }
    });

    // Clean up function to handle page unload
    window.addEventListener('beforeunload', () => {
        clearTimeout(processingTimeout);
    });
});
