let ghostElement = null;
let dragImage = null;
let mouseX = 0;
let mouseY = 0;
let animationFrameId = null;

const renderGhost = () => {
    if (ghostElement) {
        // Use translate3d for GPU acceleration
        // Offset slightly (20px) to avoid covering the cursor
        ghostElement.style.transform = `translate3d(${mouseX + 20}px, ${mouseY + 20}px, 0)`;
        animationFrameId = requestAnimationFrame(renderGhost);
    }
};

const updateGhostPosition = (e) => {
    // Just capture coordinates, don't touch DOM here
    mouseX = e.clientX;
    mouseY = e.clientY;
};

export const initDrag = (e, type, item) => {
    // 1. Create Transparent Drag Image (to hide default)
    if (!dragImage) {
        dragImage = document.createElement('img');
        dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1x1 transparent gif
    }
    e.dataTransfer.setDragImage(dragImage, 0, 0);

    // 2. Create Ghost Element
    if (ghostElement) {
        if (ghostElement.parentNode) ghostElement.parentNode.removeChild(ghostElement);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    }

    ghostElement = document.createElement('div');
    ghostElement.id = 'drag-ghost-advanced';

    // Initial Position
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Base Styles
    ghostElement.style.position = 'fixed';
    ghostElement.style.top = '0';
    ghostElement.style.left = '0';
    ghostElement.style.pointerEvents = 'none';
    ghostElement.style.zIndex = '9999';
    ghostElement.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    // Smooth cursor following with minimal delay
    ghostElement.style.transition = 'transform 75ms cubic-bezier(0.2, 0.8, 0.2, 1)';
    ghostElement.style.willChange = 'transform';

    // Visual Styles (Glassmorphism + Neon Glow)
    ghostElement.style.background = 'rgba(10, 10, 10, 0.9)';
    ghostElement.style.backdropFilter = 'blur(20px)';
    ghostElement.style.borderRadius = '12px';
    ghostElement.style.border = '1px solid rgba(255, 255, 255, 0.15)';
    ghostElement.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 243, 255, 0.4)'; // Stronger Cyan glow
    ghostElement.style.padding = '10px';
    ghostElement.style.display = 'flex';
    ghostElement.style.alignItems = 'center';
    ghostElement.style.gap = '12px';
    ghostElement.style.width = '260px';
    ghostElement.style.opacity = '0'; // Start invisible, fade in
    ghostElement.style.animation = 'fadeIn 0.15s cubic-bezier(0.2, 0.8, 0.2, 1) forwards';

    // Content
    let imageSrc = '/placeholder-album.jpg';
    let title = 'Unknown';
    let subtitle = '';

    if (type === 'track') {
        imageSrc = item.album?.cover_small || item.cover_small || '/placeholder-album.jpg';
        title = item.title;
        subtitle = item.artist?.name || 'Unknown Artist';
    } else if (type === 'playlist') {
        if (item.tracks && item.tracks.length > 0) {
            imageSrc = item.tracks[0].album?.cover_small || item.tracks[0].cover_small || '/placeholder-album.jpg';
        }
        title = item.name;
        subtitle = `${item.tracks?.length || 0} songs`;
    }

    ghostElement.innerHTML = `
        <style>
            @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        </style>
        <div style="width: 44px; height: 44px; border-radius: 8px; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
            <img src="${imageSrc}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
        <div style="flex: 1; overflow: hidden;">
            <div style="color: white; font-weight: 700; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${title}</div>
            <div style="color: #ccc; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${subtitle}</div>
        </div>
    `;

    document.body.appendChild(ghostElement);

    // 3. Start Animation Loop & Attach Listener
    document.addEventListener('dragover', updateGhostPosition);
    animationFrameId = requestAnimationFrame(renderGhost);
};

export const endDrag = () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    document.removeEventListener('dragover', updateGhostPosition);

    if (ghostElement) {
        // Fade out animation
        ghostElement.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        ghostElement.style.opacity = '0';
        ghostElement.style.transform = ghostElement.style.transform + ' scale(0.95)'; // Subtle shrink

        const elToRemove = ghostElement;
        // Clean up after animation
        setTimeout(() => {
            if (elToRemove && elToRemove.parentNode) {
                elToRemove.parentNode.removeChild(elToRemove);
            }
        }, 200);

        ghostElement = null;
    }
};

// Compatibility for old calls (if any remain during transition)
export const setDragGhost = (e, type, item) => initDrag(e, type, item);
