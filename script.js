// VibeCoding 2 - Procedural Music Generator
// Using Tone.js for audio and Tonal.js for music theory

class ProceduralMusicEngine {
    constructor() {
        this.isPlaying = false;
        this.currentScale = 'A minor';
        this.scaleNotes = [];

        // Tone.js synths (proof of concept - will be replaced with samples)
        this.synths = {
            bass: null,
            pad: null,
            arp: null,
            drums: null
        };

        // Volume controls
        this.volumes = {
            master: null,
            bass: null,
            pad: null,
            arp: null,
            drums: null
        };

        // Pattern sequences
        this.patterns = {
            bass: null,
            pad: null,
            arp: null,
            drums: null
        };

        // Enable/disable state
        this.enabled = {
            bass: true,
            pad: true,
            arp: true,
            drums: true
        };
    }

    // Initialize Tone.js audio context and instruments
    async init() {
        console.log('[ProceduralEngine] Initializing...');

        // Create master volume
        this.volumes.master = new Tone.Volume(-10).toDestination();

        // Create individual volume controls
        this.volumes.bass = new Tone.Volume(0).connect(this.volumes.master);
        this.volumes.pad = new Tone.Volume(-6).connect(this.volumes.master);
        this.volumes.arp = new Tone.Volume(-8).connect(this.volumes.master);
        this.volumes.drums = new Tone.Volume(-6).connect(this.volumes.master);

        // Create sampler for arp using your Lead Synth Anjuna samples
        // Note: # characters URL-encoded as %23 (like we did in Dreams project)
        this.synths.arp = new Tone.Sampler({
            urls: {
                'C3': 'audio/samples/Lead Synth Anjuna/ogg/C3.ogg',
                'C#3': 'audio/samples/Lead Synth Anjuna/ogg/C%233.ogg',
                'D3': 'audio/samples/Lead Synth Anjuna/ogg/D3.ogg',
                'D#3': 'audio/samples/Lead Synth Anjuna/ogg/D%233.ogg',
                'E3': 'audio/samples/Lead Synth Anjuna/ogg/E3.ogg',
                'F3': 'audio/samples/Lead Synth Anjuna/ogg/F3.ogg',
                'F#3': 'audio/samples/Lead Synth Anjuna/ogg/F%233.ogg',
                'G3': 'audio/samples/Lead Synth Anjuna/ogg/G3.ogg',
                'G#3': 'audio/samples/Lead Synth Anjuna/ogg/G%233.ogg',
                'A3': 'audio/samples/Lead Synth Anjuna/ogg/A3.ogg',
                'A#3': 'audio/samples/Lead Synth Anjuna/ogg/A%233.ogg',
                'B3': 'audio/samples/Lead Synth Anjuna/ogg/B3.ogg',
                'C4': 'audio/samples/Lead Synth Anjuna/ogg/C4.ogg'
            },
            onload: function() {
                console.log('[ProceduralEngine] Lead Synth Anjuna samples loaded!');
            }
        }).connect(this.volumes.arp);

        // Synths for bass, pad, drums (proof of concept - can be replaced with samples later)
        this.synths.bass = new Tone.MonoSynth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 1.2 }
        }).connect(this.volumes.bass);

        this.synths.pad = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: 1.5, decay: 1, sustain: 0.7, release: 2 }
        }).connect(this.volumes.pad);

        this.synths.drums = new Tone.MembraneSynth().connect(this.volumes.drums);

        console.log('[ProceduralEngine] Audio initialized (samples + synths)');

        // Set initial scale
        this.updateScale(this.currentScale);
    }

    // Update the current scale and regenerate patterns
    updateScale(scaleName) {
        console.log('[ProceduralEngine] Updating scale to: ' + scaleName);
        this.currentScale = scaleName;

        // Use Tonal.js to get the scale notes
        const scale = Tonal.Scale.get(scaleName);
        this.scaleNotes = scale.notes;

        console.log('[ProceduralEngine] Scale notes:', this.scaleNotes);

        // Regenerate patterns based on new scale
        if (this.isPlaying) {
            this.regeneratePatterns();
        }
    }

    // Generate procedural patterns based on the current scale
    regeneratePatterns() {
        console.log('[ProceduralEngine] Generating new patterns...');

        // Stop existing patterns
        this.stopPatterns();

        // Generate bass pattern (root notes, low octave)
        const bassNotes = this.generateBassPattern();
        const self = this;
        this.patterns.bass = new Tone.Sequence((time, note) => {
            if (self.enabled.bass && note) {
                self.synths.bass.triggerAttackRelease(note, '4n', time);
            }
        }, bassNotes, '2n');

        // Generate pad pattern (chords, mid octave)
        const padChords = this.generatePadPattern();
        this.patterns.pad = new Tone.Sequence((time, chord) => {
            if (self.enabled.pad && chord) {
                self.synths.pad.triggerAttackRelease(chord, '2n', time);
            }
        }, padChords, '1m');

        // Generate arp pattern (melodic, high octave)
        const arpNotes = this.generateArpPattern();
        this.patterns.arp = new Tone.Sequence((time, note) => {
            if (self.enabled.arp && note) {
                self.synths.arp.triggerAttackRelease(note, '16n', time);
            }
        }, arpNotes, '16n');

        // Generate drum pattern (kick on beats)
        const drumPattern = [null, 'C1', null, null, null, 'C1', null, null];
        this.patterns.drums = new Tone.Sequence((time, note) => {
            if (self.enabled.drums && note) {
                self.synths.drums.triggerAttackRelease(note, '8n', time);
            }
        }, drumPattern, '8n');

        // Start all patterns
        this.startPatterns();
    }

    // Generate bass pattern (root notes, lower octave)
    generateBassPattern() {
        const bassOctave = '2';

        // Simple pattern: play root and fifth
        const root = this.scaleNotes[0] + bassOctave;
        const fifth = this.scaleNotes[4] ? this.scaleNotes[4] + bassOctave : root;

        return [root, null, fifth, null, root, null, fifth, null];
    }

    // Generate pad pattern (chords)
    generatePadPattern() {
        const chordOctave = '3';

        // Build triads from scale degrees
        // I chord (1-3-5)
        const chord1 = [
            this.scaleNotes[0] + chordOctave,
            this.scaleNotes[2] + chordOctave,
            this.scaleNotes[4] + chordOctave
        ];

        // IV chord (4-6-1)
        const chord2 = [
            this.scaleNotes[3] + chordOctave,
            this.scaleNotes[5] + chordOctave,
            this.scaleNotes[0] + String(parseInt(chordOctave) + 1)
        ];

        // V chord (5-7-2)
        const chord3 = [
            this.scaleNotes[4] + chordOctave,
            this.scaleNotes[6] + chordOctave,
            this.scaleNotes[1] + String(parseInt(chordOctave) + 1)
        ];

        return [chord1, chord2, chord3, chord1];
    }

    // Generate arp pattern (melodic notes)
    generateArpPattern() {
        const arpOctave = '4';

        // Create a procedural melody using scale degrees
        const scaleWithOctave = this.scaleNotes.map(note => note + arpOctave);

        // Simple pattern: ascend and descend through scale
        return [
            scaleWithOctave[0], scaleWithOctave[2], scaleWithOctave[4],
            scaleWithOctave[2], scaleWithOctave[0], scaleWithOctave[4],
            scaleWithOctave[2], scaleWithOctave[0], null, null, null, null,
            null, null, null, null
        ];
    }

    // Start all pattern sequences
    startPatterns() {
        if (this.patterns.bass) this.patterns.bass.start(0);
        if (this.patterns.pad) this.patterns.pad.start(0);
        if (this.patterns.arp) this.patterns.arp.start(0);
        if (this.patterns.drums) this.patterns.drums.start(0);
    }

    // Stop all pattern sequences
    stopPatterns() {
        if (this.patterns.bass) this.patterns.bass.stop();
        if (this.patterns.pad) this.patterns.pad.stop();
        if (this.patterns.arp) this.patterns.arp.stop();
        if (this.patterns.drums) this.patterns.drums.stop();
    }

    // Start playback
    async start() {
        if (this.isPlaying) return;

        await Tone.start();
        console.log('[ProceduralEngine] Starting playback...');

        this.isPlaying = true;
        Tone.Transport.start();

        // Generate and start patterns
        this.regeneratePatterns();

        updateStatus('Generating music...');
    }

    // Stop playback
    stop() {
        if (!this.isPlaying) return;

        console.log('[ProceduralEngine] Stopping playback...');

        this.isPlaying = false;
        this.stopPatterns();
        Tone.Transport.stop();

        updateStatus('Stopped');
    }

    // Set master volume
    setMasterVolume(value) {
        if (this.volumes.master) {
            // Convert 0-1 to decibels (-60 to 0)
            const db = Tone.gainToDb(value);
            this.volumes.master.volume.rampTo(db, 0.1);
        }
    }

    // Set individual stem volume
    setStemVolume(stem, value) {
        if (this.volumes[stem]) {
            const db = Tone.gainToDb(value);
            this.volumes[stem].volume.rampTo(db, 0.1);
        }
    }

    // Toggle stem on/off
    toggleStem(stem, enabled) {
        this.enabled[stem] = enabled;
        console.log('[ProceduralEngine] ' + stem + ' ' + (enabled ? 'enabled' : 'disabled'));
    }
}

// Global engine instance
const engine = new ProceduralMusicEngine();

// UI Helper Functions
function updateStatus(message) {
    document.getElementById('status').textContent = message;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[VibeCoding2] Page loaded, initializing...');

    // Initialize engine
    await engine.init();
    updateStatus('Ready - Click Start to generate music');

    // Play/Pause Button
    const playPauseBtn = document.getElementById('playPause');
    playPauseBtn.addEventListener('click', async () => {
        if (!engine.isPlaying) {
            await engine.start();
            playPauseBtn.textContent = 'Stop';
        } else {
            engine.stop();
            playPauseBtn.textContent = 'Start';
        }
    });

    // Key/Scale Selection
    const keySelect = document.getElementById('keySelect');
    keySelect.addEventListener('change', (e) => {
        engine.updateScale(e.target.value);
        updateStatus('Changed to ' + e.target.value);
    });

    // Master Volume
    const masterVolume = document.getElementById('masterVolume');
    const masterVolumeValue = document.getElementById('masterVolumeValue');
    masterVolume.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        engine.setMasterVolume(value);
        masterVolumeValue.textContent = Math.round(value * 100) + '%';
    });

    // Stem Volume Controls
    document.querySelectorAll('.stem-volume').forEach(slider => {
        const stemName = slider.id.replace('Volume', '').toLowerCase();
        const valueDisplay = slider.nextElementSibling;

        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            engine.setStemVolume(stemName, value);
            valueDisplay.textContent = Math.round(value * 100) + '%';

            // Auto-toggle stem based on volume
            const toggleBtn = slider.parentElement.querySelector('.toggle-stem');
            if (value === 0 && toggleBtn.classList.contains('active')) {
                toggleBtn.click();
            } else if (value > 0 && !toggleBtn.classList.contains('active')) {
                toggleBtn.click();
            }
        });
    });

    // Stem Toggle Buttons
    document.querySelectorAll('.toggle-stem').forEach(btn => {
        btn.addEventListener('click', () => {
            const stem = btn.dataset.stem;
            const isActive = btn.classList.toggle('active');

            btn.textContent = isActive ? 'Active' : 'Muted';
            engine.toggleStem(stem, isActive);
        });
    });

    console.log('[VibeCoding2] Initialization complete');
});
