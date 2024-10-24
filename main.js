const inputA = document.getElementById('inputA');
const inputB = document.getElementById('inputB');
const processButton = document.getElementById('processButton');
const downloadButton = document.getElementById('downloadButton');
const canvas = document.getElementById('canvas');
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
    const context = canvas.getContext('2d');
    const tileSize = 8;
    const gridSize = 16;
    canvas.width = gridSize * tileSize;
    canvas.height = gridSize * tileSize;

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
            
            imageA.onload = function() {
                const imageACanvas = document.createElement('canvas');
                imageACanvas.width = gridSize;
                imageACanvas.height = gridSize;
                const imageAContext = imageACanvas.getContext('2d');
                imageAContext.drawImage(imageA, 0, 0, gridSize, gridSize);
                const imageAData = imageAContext.getImageData(0, 0, gridSize, gridSize);

                for (let y = 0; y < gridSize; y++) {
                    for (let x = 0; x < gridSize; x++) {
                        const indexA = (y * gridSize + x) * 4;
                        const rA = imageAData.data[indexA];
                        const gA = imageAData.data[indexA + 1];
                        const bA = imageAData.data[indexA + 2];

                        const adjustedBData = new Uint8ClampedArray(imageBData.data);
                        for (let i = 0; i < adjustedBData.length; i += 4) {
                            adjustedBData[i] = (adjustedBData[i] / 255) * rA;
                            adjustedBData[i + 1] = (adjustedBData[i + 1] / 255) * gA;
                            adjustedBData[i + 2] = (adjustedBData[i + 2] / 255) * bA;
                        }

                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = tileSize;
                        tempCanvas.height = tileSize;
                        const tempContext = tempCanvas.getContext('2d');
                        const adjustedImageData = new ImageData(adjustedBData, tileSize, tileSize);
                        tempContext.putImageData(adjustedImageData, 0, 0);
                        context.drawImage(tempCanvas, x * tileSize, y * tileSize, tileSize, tileSize);
                    }
                }

                canvas.toBlob(function(blob) {
                    zip.file(`image_${index + 1}.png`, blob);
                    processedImages.push(`image_${index + 1}.png`);
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
    processedImages.forEach(function(image) {
        zip.file(image, canvas.toDataURL('image/png').split(',')[1], {base64: true});
    });
    zip.generateAsync({ type: 'blob' }).then(function(content) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'processed_images.zip';
        link.click();
    });
};
