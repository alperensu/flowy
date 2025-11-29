'use client';

import React from 'react';

export default function Section({ title, subtitle, children, className = '' }) {
    return (
        <section className={`card-container p-6 animate-fade-in-up ${className}`}>
            <div className="mb-4">
                <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer w-fit">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-sm text-gray-400 font-medium mt-1">
                        {subtitle}
                    </p>
                )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 min-[1800px]:grid-cols-7 gap-6">
                {children}
            </div>
        </section>
    );
}
