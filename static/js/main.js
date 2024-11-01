document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const dragDropZone = document.getElementById('drag-drop-zone');
    const fileList = document.getElementById('file-list');
    const resultsGrid = document.getElementById('results-grid');
    const batchDownload = document.getElementById('batch-download');

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
        fileInput.files = e.dataTransfer.files;
        updateFileList();
    });

    fileInput.addEventListener('change', updateFileList);

    function updateFileList() {
        fileList.innerHTML = '';
        Array.from(fileInput.files).forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span>${file.name}</span>
                <div class="progress-bar hidden">
                    <div class="progress-bar-fill" style="width: 0%"></div>
                </div>
            `;
            fileList.appendChild(fileItem);
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const selectedAlgorithms = Array.from(form.querySelectorAll('input[name="algorithms"]:checked'))
            .map(input => input.value);
        
        if (selectedAlgorithms.length === 0) {
            alert('Please select at least one dithering algorithm');
            return;
        }

        resultsGrid.innerHTML = '';
        form.classList.add('loading');
        const files = Array.from(fileInput.files);
        const results = [];

        for (let file of files) {
            const fileItem = fileList.querySelector(`div:contains('${file.name}')`);
            const progressBar = fileItem.querySelector('.progress-bar');
            progressBar.classList.remove('hidden');

            for (let algorithm of selectedAlgorithms) {
                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('algorithm', algorithm);

                    const response = await fetch('/dither', {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        
                        const resultCard = document.createElement('div');
                        resultCard.className = 'result-card';
                        resultCard.innerHTML = `
                            <h3 class="font-bold mb-2">${file.name} - ${algorithm}</h3>
                            <img src="${url}" alt="Dithered image">
                            <a href="${url}" download="${algorithm}_${file.name}" class="mt-2 inline-block bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded">
                                Download
                            </a>
                        `;
                        resultsGrid.appendChild(resultCard);
                        results.push({ url, filename: `${algorithm}_${file.name}` });
                    } else {
                        const error = await response.json();
                        throw new Error(error.error);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    const errorCard = document.createElement('div');
                    errorCard.className = 'result-card bg-red-50';
                    errorCard.innerHTML = `
                        <h3 class="font-bold mb-2">${file.name} - ${algorithm}</h3>
                        <p class="text-red-500">Error: ${error.message}</p>
                    `;
                    resultsGrid.appendChild(errorCard);
                }
            }
        }

        form.classList.remove('loading');
        if (results.length > 0) {
            batchDownload.classList.remove('hidden');
            batchDownload.querySelector('button').onclick = () => {
                results.forEach(({ url, filename }) => {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    link.click();
                });
            };
        }
    });

    // Helper function to find elements containing text
    Element.prototype.contains = function(text) {
        return this.textContent.includes(text);
    };
});
