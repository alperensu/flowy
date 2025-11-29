export const getDominantColor = (imageSrc) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 1;
            canvas.height = 1;

            // Draw the image resized to 1x1 to get average color
            ctx.drawImage(img, 0, 0, 1, 1);

            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            resolve(`rgb(${r}, ${g}, ${b})`);
        };

        img.onerror = (err) => {
            console.error("Error extracting color", err);
            resolve(null); // Fallback
        };
    });
};
