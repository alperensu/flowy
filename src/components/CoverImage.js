'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Music } from 'lucide-react';

const CoverImage = ({ src, alt, className, fill = false, width, height, sizes, priority = false }) => {
    const [error, setError] = useState(false);
    const [imgSrc, setImgSrc] = useState(src);

    useEffect(() => {
        setImgSrc(src);
        setError(false);
    }, [src]);

    const handleError = () => {
        setError(true);
    };

    if (error || !imgSrc) {
        return (
            <div
                className={`bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center ${className}`}
                style={!fill ? { width, height } : {}}
            >
                <Music className="text-gray-600 w-1/3 h-1/3" />
            </div>
        );
    }

    return (
        <Image
            src={imgSrc}
            alt={alt || "Album Cover"}
            className={className}
            fill={fill}
            width={!fill ? width : undefined}
            height={!fill ? height : undefined}
            sizes={sizes}
            priority={priority}
            onError={handleError}
            unoptimized={true} // Helpful for external URLs that might 403 with Next.js optimization
        />
    );
};

export default CoverImage;
