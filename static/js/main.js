document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const algorithmSelect = document.getElementById('algorithm');
    const dragDropZone = document.getElementById('drag-drop-zone');
    const preview = document.getElementById('preview');
    const result = document.getElementById('result');
    const downloadLink = document.getElementById('download-link');

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
        updatePreview();
    });

    fileInput.addEventListener('change', updatePreview);

    function updatePreview() {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        try {
            const response = await fetch('/dither', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                result.src = url;
                result.style.display = 'block';
                downloadLink.href = url;
                downloadLink.style.display = 'inline-block';
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while processing the image.');
        }
    });
});
