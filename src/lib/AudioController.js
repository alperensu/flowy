class AudioController {
    constructor() {
        this.audioContext = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.analyser = null;
        this.bands = {};
        this.frequencies = [60, 150, 400, 1000, 2400, 6000, 16000];
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();

            // Create Master Gain
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 1.0;

            // Create Dynamics Compressor (Adaptive Soundscape)
            this.compressor = this.audioContext.createDynamicsCompressor();
            this.compressor.threshold.value = -24;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 12;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;

            // Create Analyser
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048; // Higher resolution for better visualization
            this.analyser.smoothingTimeConstant = 0.8;

            // Create Bands
            let previousNode = null;

            this.frequencies.forEach((freq, index) => {
                const filter = this.audioContext.createBiquadFilter();

                if (index === 0) {
                    filter.type = 'lowshelf';
                } else if (index === this.frequencies.length - 1) {
                    filter.type = 'highshelf';
                } else {
                    filter.type = 'peaking';
                    filter.Q.value = 1.0; // User requested Q ~ 1.0
                }

                filter.frequency.value = freq;
                filter.gain.value = 0;

                this.bands[freq] = filter;

                // Chain nodes
                if (previousNode) {
                    previousNode.connect(filter);
                }
                previousNode = filter;
            });

            // Connect Chain: Source (later) -> Band1 -> ... -> Band7 -> Compressor -> Gain -> Analyser -> Destination
            const firstBand = this.bands[this.frequencies[0]];
            const lastBand = this.bands[this.frequencies[this.frequencies.length - 1]];

            lastBand.connect(this.compressor);
            this.compressor.connect(this.gainNode);
            this.gainNode.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            this.initialized = true;
            console.log("AudioController initialized with 7-Band EQ");
        } catch (e) {
            console.error("Failed to initialize AudioController", e);
        }
    }

    connectSource(mediaElement) {
        if (!this.initialized || !mediaElement) return;

        try {
            // Disconnect old source if exists
            if (this.sourceNode) {
                this.sourceNode.disconnect();
            }

            this.sourceNode = this.audioContext.createMediaElementSource(mediaElement);
            const firstBand = this.bands[this.frequencies[0]];
            this.sourceNode.connect(firstBand);

            // Resume context if suspended
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        } catch (e) {
            // console.warn("CORS or Source connection issue:", e);
        }
    }

    setBandGain(frequency, gain) {
        if (this.bands[frequency]) {
            // Use setTargetAtTime for smooth transitions (prevents popping/zipper noise)
            this.bands[frequency].gain.setTargetAtTime(gain, this.audioContext.currentTime, 0.01);
        }
    }

    setMasterVolume(volume) {
        if (this.gainNode) {
            this.gainNode.gain.value = volume;
        }
    }

    getAnalyserData(dataArray) {
        if (this.analyser) {
            this.analyser.getByteFrequencyData(dataArray);
        }
    }
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log("AudioContext resumed successfully");
            });
        }
    }
}

const audioController = new AudioController();
export default audioController;
