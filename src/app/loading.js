export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] animate-breathe mix-blend-screen"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-breathe mix-blend-screen" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-10">
                {/* Sound Wave Visualizer */}
                <div className="flex items-center gap-1.5 h-16">
                    {[...Array(9)].map((_, i) => (
                        <div
                            key={i}
                            className="w-2 bg-gradient-to-t from-cyan-400 to-purple-500 rounded-full shadow-[0_0_15px_rgba(0,243,255,0.5)]"
                            style={{
                                animation: `soundWave 1s ease-in-out infinite`,
                                animationDelay: `${i * 0.1}s`,
                                height: '20%' // Initial height
                            }}
                        ></div>
                    ))}
                </div>

                {/* Logo Text with Shimmer */}
                <div className="relative">
                    <h1 className="text-4xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 opacity-20 blur-[1px] absolute inset-0 select-none">
                        SONICFLOW
                    </h1>
                    <h1 className="text-4xl font-black tracking-[0.2em] text-white relative z-10 animate-shimmer select-none drop-shadow-[0_0_20px_rgba(0,243,255,0.3)]">
                        SONICFLOW
                    </h1>
                </div>

                {/* Loading Indicator */}
                <div className="flex gap-2 mt-4">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
}
