document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const dragDropZone = document.getElementById('drag-drop-zone');
    const fileList = document.getElementById('file-list');
    const resultsGrid = document.getElementById('results-grid');
    const batchDownload = document.getElementById('batch-download');
    const submitButton = form.querySelector('button[type="submit"]');

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const blobUrls = new Set();
    let totalFiles = 0;
    let processedFiles = 0;
    let processingTimeout;

    window.addEventListener('beforeunload', () => {
        blobUrls.forEach(url => URL.revokeObjectURL(url));
        clearTimeout(processingTimeout);
    });

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
                    <span class="text-xs text-gray-500 processing-status">
                        🟢 Ready
                    </span>
                </div>
                <div class="algorithm-statuses mt-1 text-xs space-y-1">
                    <!-- Algorithm-specific progress bars will be added here during processing -->
                </div>
            `;
            fileList.appendChild(fileItem);
        });
    }

    function createAlgorithmStatus(algorithm) {
        const algorithmStatus = document.createElement('div');
        algorithmStatus.setAttribute('data-algorithm', algorithm);
        algorithmStatus.className = 'algorithm-status';
        algorithmStatus.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${algorithm}</span>
                <span class="processing-status">🔄 Processing...</span>
            </div>
            <div class="progress-bar mt-1">
                <div class="progress-bar-fill" style="width: 0%"></div>
            </div>
        `;
        return algorithmStatus;
    }

    function updateAlgorithmStatus(fileItem, algorithm, status, error = null) {
        let statusesContainer = fileItem.querySelector('.algorithm-statuses');
        let algorithmStatus = statusesContainer.querySelector(`[data-algorithm="${algorithm}"]`);
        
        if (!algorithmStatus) {
            algorithmStatus = createAlgorithmStatus(algorithm);
            statusesContainer.appendChild(algorithmStatus);
        }

        const statusSpan = algorithmStatus.querySelector('.processing-status');
        const progressBar = algorithmStatus.querySelector('.progress-bar-fill');

        switch (status) {
            case 'processing':
                statusSpan.textContent = '🔄 Processing...';
                progressBar.style.width = '0%';  // Changed from '50%' to '0%'
                progressBar.style.backgroundColor = '#4CAF50';
                break;
            case 'completed':
                statusSpan.textContent = '🟢 Completed';
                progressBar.style.width = '100%';
                progressBar.style.backgroundColor = '#4CAF50';
                break;
            case 'failed':
                statusSpan.textContent = `🔴 ${error || 'Failed'}`;
                progressBar.style.width = '100%';
                progressBar.style.backgroundColor = '#ef4444';
                break;
        }
    }

    async function processFile(file, algorithm, fileItem) {
        const mainStatus = fileItem.querySelector('.processing-status');
        mainStatus.innerHTML = '🔄 Processing...';
        
        try {
            updateAlgorithmStatus(fileItem, algorithm, 'processing');

            const formData = new FormData();
            formData.append('file', file);
            formData.append('algorithm', algorithm);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

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
            blobUrls.add(url);

            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.innerHTML = `
                <h3 class="font-bold mb-2">${file.name} - ${algorithm}</h3>
                <img src="${url}" alt="Dithered image" class="mb-2" loading="lazy">
                <a href="${url}" download="${algorithm}_${file.name}" 
                   class="inline-block bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded">
                    Download
                </a>
            `;

            resultsGrid.appendChild(resultCard);
            updateAlgorithmStatus(fileItem, algorithm, 'completed');

            const allCompleted = Array.from(fileItem.querySelectorAll('.algorithm-status'))
                .every(status => status.querySelector('.processing-status').textContent.includes('Completed'));
            
            if (allCompleted) {
                mainStatus.innerHTML = '🟢 All Complete';
            }

            return { 
                url,
                filename: `${algorithm}_${file.name}`,
                blob,
                mimeType: blob.type || 'image/png'
            };
        } catch (error) {
            console.error('Error:', error);
            updateAlgorithmStatus(fileItem, algorithm, 'failed', error.message);
            
            const allFailed = Array.from(fileItem.querySelectorAll('.algorithm-status'))
                .every(status => status.querySelector('.processing-status').textContent.includes('🔴'));
            
            if (allFailed) {
                mainStatus.innerHTML = '🔴 Failed';
            }
            
            throw error;
        } finally {
            processedFiles++;
            updateOverallProgress();
        }
    }

    async function createZipDownload(results) {
        const zip = new JSZip();
        const batchButton = batchDownload.querySelector('button');
        const originalText = batchButton.textContent;
        
        try {
            batchButton.disabled = true;
            
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                const progress = Math.round(((i + 1) / results.length) * 100);
                batchButton.textContent = `Preparing ZIP... ${progress}%`;
                
                try {
                    zip.file(result.filename, result.blob, { binary: true });
                } catch (error) {
                    console.error(`Failed to add ${result.filename} to ZIP:`, error);
                    showError(`Failed to add ${result.filename} to ZIP`);
                }
            }
            
            batchButton.textContent = 'Generating ZIP file...';
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipUrl = URL.createObjectURL(zipBlob);
            blobUrls.add(zipUrl);
            
            const link = document.createElement('a');
            link.href = zipUrl;
            link.download = 'dithered_images.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => {
                URL.revokeObjectURL(zipUrl);
                blobUrls.delete(zipUrl);
            }, 1000);
            
        } catch (error) {
            console.error('Failed to create ZIP:', error);
            showError('Failed to create ZIP file');
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

        blobUrls.forEach(url => URL.revokeObjectURL(url));
        blobUrls.clear();

        resultsGrid.innerHTML = '';
        batchDownload.classList.add('hidden');
        submitButton.disabled = true;
        form.classList.add('loading');
        
        totalFiles = files.length * selectedAlgorithms.length;
        processedFiles = 0;
        const results = [];

        processingTimeout = setTimeout(() => {
            if (processedFiles < totalFiles) {
                showError('Processing is taking longer than expected. Please try with fewer images or algorithms.');
                submitButton.textContent = 'Process Images';
                submitButton.disabled = false;
                form.classList.remove('loading');
            }
        }, 120000);

        try {
            for (const file of files) {
                const fileItem = Array.from(fileList.children)
                    .find(item => item.querySelector('span').textContent === file.name);

                const fileResults = await Promise.allSettled(
                    selectedAlgorithms.map(algorithm => 
                        processFile(file, algorithm, fileItem)
                    )
                );

                fileResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    }
                });
            }
        } catch (error) {
            showError('An error occurred during batch processing');
            console.error('Batch processing error:', error);
        } finally {
            if (results.length > 0) {
                batchDownload.classList.remove('hidden');
                batchDownload.querySelector('button').onclick = () => createZipDownload(results);
            }
        }
    });
});
