/**
 * Performance Metrics Utility
 * Tracks Web Vitals and custom performance metrics
 */

class PerformanceMetrics {
    constructor() {
        this.metrics = {
            audioLatency: [],
            pageTransitions: [],
            apiResponseTimes: [],
            scrollFPS: []
        };

        this.isTracking = typeof window !== 'undefined' && window.performance;
    }

    /**
     * Mark the start of an operation
     */
    markStart(name) {
        if (!this.isTracking) return;
        performance.mark(`${name}-start`);
    }

    /**
     * Mark the end of an operation and calculate duration
     */
    markEnd(name, category = 'custom') {
        if (!this.isTracking) return;

        try {
            performance.mark(`${name}-end`);
            performance.measure(name, `${name}-start`, `${name}-end`);

            const measures = performance.getEntriesByName(name);
            if (measures.length > 0) {
                const duration = measures[0].duration;
                this.recordMetric(category, duration);

                // Clean up marks
                performance.clearMarks(`${name}-start`);
                performance.clearMarks(`${name}-end`);
                performance.clearMeasures(name);

                return duration;
            }
        } catch (error) {
            console.error('[PerformanceMetrics] Error measuring:', error);
        }

        return null;
    }

    /**
     * Record a custom metric
     */
    recordMetric(category, value) {
        if (!this.metrics[category]) {
            this.metrics[category] = [];
        }

        this.metrics[category].push({
            value,
            timestamp: Date.now()
        });

        // Keep only last 100 entries per category
        if (this.metrics[category].length > 100) {
            this.metrics[category].shift();
        }
    }

    /**
     * Measure audio playback latency
     */
    async measureAudioLatency(trackId) {
        this.markStart(`audio-${trackId}`);
        return () => this.markEnd(`audio-${trackId}`, 'audioLatency');
    }

    /**
     * Measure page transition time
     */
    measurePageTransition(fromPage, toPage) {
        const key = `transition-${fromPage}-${toPage}`;
        this.markStart(key);
        return () => this.markEnd(key, 'pageTransitions');
    }

    /**
     * Measure API response time
     */
    measureAPICall(endpoint) {
        const key = `api-${endpoint}-${Date.now()}`;
        this.markStart(key);
        return () => this.markEnd(key, 'apiResponseTimes');
    }

    /**
     * Track scroll FPS using requestAnimationFrame
     */
    trackScrollFPS(element) {
        if (!this.isTracking) return () => { };

        let frameCount = 0;
        let lastTime = performance.now();
        let rafId;

        const measureFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            const elapsed = currentTime - lastTime;

            if (elapsed >= 1000) { // Every second
                const fps = Math.round((frameCount * 1000) / elapsed);
                this.recordMetric('scrollFPS', fps);
                frameCount = 0;
                lastTime = currentTime;
            }

            rafId = requestAnimationFrame(measureFPS);
        };

        rafId = requestAnimationFrame(measureFPS);

        // Return cleanup function
        return () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        };
    }

    /**
     * Get statistics for a metric category
     */
    getStats(category) {
        const values = this.metrics[category]?.map(m => m.value) || [];

        if (values.length === 0) {
            return {
                count: 0,
                avg: 0,
                min: 0,
                max: 0,
                p50: 0,
                p95: 0,
                p99: 0
            };
        }

        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);

        return {
            count: values.length,
            avg: Math.round(sum / values.length),
            min: Math.round(sorted[0]),
            max: Math.round(sorted[sorted.length - 1]),
            p50: Math.round(sorted[Math.floor(sorted.length * 0.5)]),
            p95: Math.round(sorted[Math.floor(sorted.length * 0.95)]),
            p99: Math.round(sorted[Math.floor(sorted.length * 0.99)])
        };
    }

    /**
     * Get all performance statistics
     */
    getAllStats() {
        return {
            audioLatency: this.getStats('audioLatency'),
            pageTransitions: this.getStats('pageTransitions'),
            apiResponseTimes: this.getStats('apiResponseTimes'),
            scrollFPS: this.getStats('scrollFPS')
        };
    }

    /**
     * Log performance report to console
     */
    logReport() {
        console.group('📊 Performance Metrics Report');

        const stats = this.getAllStats();

        console.table({
            'Audio Latency (ms)': {
                Average: stats.audioLatency.avg,
                'P95': stats.audioLatency.p95,
                'Min/Max': `${stats.audioLatency.min}/${stats.audioLatency.max}`
            },
            'Page Transitions (ms)': {
                Average: stats.pageTransitions.avg,
                'P95': stats.pageTransitions.p95,
                'Min/Max': `${stats.pageTransitions.min}/${stats.pageTransitions.max}`
            },
            'API Calls (ms)': {
                Average: stats.apiResponseTimes.avg,
                'P95': stats.apiResponseTimes.p95,
                'Min/Max': `${stats.apiResponseTimes.min}/${stats.apiResponseTimes.max}`
            },
            'Scroll FPS': {
                Average: stats.scrollFPS.avg,
                'P95': stats.scrollFPS.p95,
                'Min/Max': `${stats.scrollFPS.min}/${stats.scrollFPS.max}`
            }
        });

        // Check against targets
        const warnings = [];
        if (stats.audioLatency.avg > 2000) {
            warnings.push('⚠️  Audio latency exceeds 2s target');
        }
        if (stats.pageTransitions.avg > 350) {
            warnings.push('⚠️  Page transitions exceed 350ms target');
        }
        if (stats.scrollFPS.avg < 60) {
            warnings.push('⚠️  Scroll FPS below 60fps target');
        }

        if (warnings.length > 0) {
            console.warn('Performance Issues:', warnings.join('\n'));
        } else {
            console.log('✅ All performance targets met!');
        }

        console.groupEnd();
    }

    /**
     * Reset all metrics
     */
    reset() {
        this.metrics = {
            audioLatency: [],
            pageTransitions: [],
            apiResponseTimes: [],
            scrollFPS: []
        };
    }
}

// Singleton instance
const performanceMetrics = new PerformanceMetrics();

// Expose to window for debugging
if (typeof window !== 'undefined') {
    window.performanceMetrics = performanceMetrics;

    // Log report every 60 seconds in development
    if (process.env.NODE_ENV === 'development') {
        setInterval(() => {
            performanceMetrics.logReport();
        }, 60000);
    }
}

export default performanceMetrics;
