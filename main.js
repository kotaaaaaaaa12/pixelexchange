const inputA = document.getElementById('inputA');
const inputB = document.getElementById('inputB');
const processButton = document.getElementById('processButton');
const downloadButton = document.getElementById('downloadButton');
const resultContainer = document.getElementById('resultContainer');
let processedImages = [];

inputA.classList.remove('hidden');
inputB.classList.remove('hidden');

inputA.onchange = inputB.onchange = function() {
    if (inputA.files.length > 0 && inputB.files.length > 0) {
        processButton.classList.remove('hidden');
    }
};

processButton.onclick = function() {
    processButton.classList.add('hidden');
    inputA.classList.add('hidden');
    inputB.classList.add('hidden');

    const zip = new JSZip();
    const tileSize = 8;
    const gridSize = 16;

    const imageB = new Image();
    const imageBFile = URL.createObjectURL(inputB.files[0]);

    imageB.onload = function() {
        const imageBCanvas = document.createElement('canvas');
        imageBCanvas.width = tileSize;
        imageBCanvas.height = tileSize;
        const imageBContext = imageBCanvas.getContext('2d');
        imageBContext.drawImage(imageB, 0, 0, tileSize, tileSize);
        const imageBData = imageBContext.getImageData(0, 0, tileSize, tileSize);

        Array.from(inputA.files).forEach((file, index) => {
            const imageA = new Image();
            const imageAFile = URL.createObjectURL(file);
            const fileNameA = file.name;

            imageA.onload = function() {
                const imageACanvas = document.createElement('canvas');
                imageACanvas.width = gridSize * tileSize;
                imageACanvas.height = gridSize * tileSize;
                const imageAContext = imageACanvas.getContext('2d');
                imageAContext.drawImage(imageA, 0, 0, gridSize, gridSize);
                const imageAData = imageAContext.getImageData(0, 0, gridSize, gridSize);

                const resultCanvas = document.createElement('canvas');
                resultCanvas.width = gridSize * tileSize;
                resultCanvas.height = gridSize * tileSize;
                const resultContext = resultCanvas.getContext('2d');

                for (let y = 0; y < gridSize; y++) {
                    for (let x = 0; x < gridSize; x++) {
                        const indexA = (y * gridSize + x) * 4;
                        const rA = imageAData.data[indexA];
                        const gA = imageAData.data[indexA + 1];
                        const bA = imageAData.data[indexA + 2];
                        const aA = imageAData.data[indexA + 3];

                        if (aA === 0) {
                            continue;
                        }

                        const adjustedBData = new Uint8ClampedArray(imageBData.data);
                        for (let i = 0; i < adjustedBData.length; i += 4) {
                            adjustedBData[i] = (adjustedBData[i] / 255) * rA;
                            adjustedBData[i + 1] = (adjustedBData[i + 1] / 255) * gA;
                            adjustedBData[i + 2] = (adjustedBData[i + 2] / 255) * bA;
                            adjustedBData[i + 3] = aA;
                        }

                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = tileSize;
                        tempCanvas.height = tileSize;
                        const tempContext = tempCanvas.getContext('2d');
                        const adjustedImageData = new ImageData(adjustedBData, tileSize, tileSize);
                        tempContext.putImageData(adjustedImageData, 0, 0);
                        resultContext.drawImage(tempCanvas, x * tileSize, y * tileSize, tileSize, tileSize);
                    }
                }

                resultContainer.appendChild(resultCanvas);
                resultCanvas.toBlob(function(blob) {
                    zip.file(fileNameA, blob);
                    processedImages.push(fileNameA);
                    if (processedImages.length === inputA.files.length) {
                        downloadButton.classList.remove('hidden');
                    }
                });
            };
            imageA.src = imageAFile;
        });
    };
    imageB.src = imageBFile;
};

downloadButton.onclick = function() {
    const zip = new JSZip();
    const resultCanvases = document.querySelectorAll('#resultContainer canvas');
    
    resultCanvases.forEach((canvas, index) => {
        canvas.toBlob(function(blob) {
            const fileName = processedImages[index];
            zip.file(fileName, blob);
        });
    });

    zip.generateAsync({ type: 'blob' }).then(function(content) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'processed_images.zip';
        link.click();
    });
};
