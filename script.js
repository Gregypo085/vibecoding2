// VibeCoding 2 - Procedural Music Generator
// Using Tone.js for audio and Tonal.js for music theory

class ProceduralMusicEngine {
    constructor() {
        this.isPlaying = false;
        this.currentScale = 'A minor';
        this.scaleNotes = [];
        this.currentDrumPattern = 0;
        this.drumPitchOffset = 0;
        this.currentStyle = 'synthwave';

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

        // Drum patterns (8th note grid: beats 1, 1&, 2, 2&, 3, 3&, 4, 4&)
        this.drumPatterns = [
            { name: '4-on-Floor', pattern: ['C1', null, 'C1', null, 'C1', null, 'C1', null] },
            { name: '1, 2&', pattern: ['C1', null, null, 'C1', null, null, null, null] },
            { name: '1, 2&, 4', pattern: ['C1', null, null, 'C1', null, null, 'C1', null] },
            { name: '1, 3', pattern: ['C1', null, null, null, 'C1', null, null, null] },
            { name: '1&, 3&', pattern: [null, 'C1', null, null, null, 'C1', null, null] },
            { name: '1, 2, 3&, 4', pattern: ['C1', null, 'C1', null, null, 'C1', 'C1', null] }
        ];

        // Style presets for procedural generation
        this.styles = {
            synthwave: {
                name: 'Synthwave',
                bpmRange: [80, 110],
                chordProgressions: [
                    [0, 5, 2, 6],  // i-VI-III-VII
                    [0, 3, 6, 5],  // i-iv-VII-VI
                    [0, 5, 3, 6]   // i-VI-iv-VII
                ],
                bassPatterns: ['pulsing', 'root-fifth'],
                arpPatterns: ['arpeggiated', 'melodic'],
                drumPatterns: [0, 2]  // 4-on-floor, 1-2&-4
            },
            techno: {
                name: 'Techno',
                bpmRange: [125, 135],
                chordProgressions: [
                    [0, 0, 3, 0],  // i-i-iv-i
                    [0, 6, 0, 6],  // i-VII-i-VII
                    [0, 3, 0, 3]   // i-iv-i-iv
                ],
                bassPatterns: ['minimal', 'driving'],
                arpPatterns: ['stabs', 'minimal'],
                drumPatterns: [0, 5]  // 4-on-floor, complex
            },
            trance: {
                name: 'Trance',
                bpmRange: [130, 140],
                chordProgressions: [
                    [0, 5, 3, 4],  // i-VI-iv-V
                    [0, 3, 5, 6],  // i-iv-VI-VII
                    [0, 5, 6, 4]   // i-VI-VII-V
                ],
                bassPatterns: ['rolling', 'pulsing'],
                arpPatterns: ['fast-arpeggiated', 'uplifting'],
                drumPatterns: [0, 2]  // 4-on-floor variations
            },
            house: {
                name: 'House',
                bpmRange: [120, 128],
                chordProgressions: [
                    [0, 3, 5, 4],  // i-iv-VI-V
                    [0, 5, 3, 6],  // i-VI-iv-VII
                    [0, 4, 5, 3]   // i-V-VI-iv
                ],
                bassPatterns: ['groovy', 'funky'],
                arpPatterns: ['melodic', 'rhythmic'],
                drumPatterns: [0, 2, 5]  // 4-on-floor variations
            },
            ambient: {
                name: 'Ambient',
                bpmRange: [60, 80],
                chordProgressions: [
                    [0, 3, 5, 2],  // i-iv-VI-III
                    [0, 5, 3, 0],  // i-VI-iv-i
                    [0, 2, 5, 0]   // i-III-VI-i
                ],
                bassPatterns: ['sustained', 'minimal'],
                arpPatterns: ['sparse', 'atmospheric'],
                drumPatterns: [3, 4]  // minimal, no 4-on-floor
            }
        };
    }

    // Initialize Tone.js audio context and instruments
    async init() {
        console.log('[ProceduralEngine] Initializing...');
        updateStatus('Loading audio...');

        // Create master volume
        this.volumes.master = new Tone.Volume(-10).toDestination();

        // Create individual volume controls
        this.volumes.bass = new Tone.Volume(0).connect(this.volumes.master);
        this.volumes.pad = new Tone.Volume(-6).connect(this.volumes.master);
        this.volumes.arp = new Tone.Volume(-8).connect(this.volumes.master);
        this.volumes.drums = new Tone.Volume(-6).connect(this.volumes.master);

        // Create sampler for arp using your LeadSynthAnjuna samples
        // Tone.js will handle URL encoding automatically - use literal filenames
        const self = this;
        this.synths.arp = await new Promise((resolve) => {
            const sampler = new Tone.Sampler({
                urls: {
                    'C3': 'audio/samples/LeadSynthAnjuna/ogg/C3.ogg',
                    'C#3': 'audio/samples/LeadSynthAnjuna/ogg/C#3.ogg',
                    'D3': 'audio/samples/LeadSynthAnjuna/ogg/D3.ogg',
                    'D#3': 'audio/samples/LeadSynthAnjuna/ogg/D#3.ogg',
                    'E3': 'audio/samples/LeadSynthAnjuna/ogg/E3.ogg',
                    'F3': 'audio/samples/LeadSynthAnjuna/ogg/F3.ogg',
                    'F#3': 'audio/samples/LeadSynthAnjuna/ogg/F#3.ogg',
                    'G3': 'audio/samples/LeadSynthAnjuna/ogg/G3.ogg',
                    'G#3': 'audio/samples/LeadSynthAnjuna/ogg/G#3.ogg',
                    'A3': 'audio/samples/LeadSynthAnjuna/ogg/A3.ogg',
                    'A#3': 'audio/samples/LeadSynthAnjuna/ogg/A#3.ogg',
                    'B3': 'audio/samples/LeadSynthAnjuna/ogg/B3.ogg',
                    'C4': 'audio/samples/LeadSynthAnjuna/ogg/C4.ogg'
                },
                onload: function() {
                    console.log('[ProceduralEngine] Lead Synth Anjuna samples loaded!');
                    updateStatus('Samples loaded - Ready to play');
                    resolve(sampler);
                },
                onerror: function(error) {
                    console.error('[ProceduralEngine] Error loading samples:', error);
                    updateStatus('Error loading samples - check console');
                }
            }).connect(self.volumes.arp);
        });

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

        updateStatus('Ready - Click Start to generate music');
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
        console.log('[ProceduralEngine] Bass pattern:', bassNotes);
        const self = this;
        this.patterns.bass = new Tone.Sequence((time, note) => {
            if (self.enabled.bass && note) {
                console.log('[Bass] Playing:', note, 'at', time);
                self.synths.bass.triggerAttackRelease(note, '4n', time);
            }
        }, bassNotes, '2n');

        // Generate pad pattern (chords, mid octave)
        const padChords = this.generatePadPattern();
        console.log('[ProceduralEngine] Pad pattern:', padChords);
        this.patterns.pad = new Tone.Sequence((time, chord) => {
            if (self.enabled.pad && chord) {
                console.log('[Pad] Playing:', chord, 'at', time);
                self.synths.pad.triggerAttackRelease(chord, '2n', time);
            }
        }, padChords, '1m');

        // Generate arp pattern (melodic, high octave)
        const arpNotes = this.generateArpPattern();
        console.log('[ProceduralEngine] Arp pattern:', arpNotes);
        this.patterns.arp = new Tone.Sequence((time, note) => {
            if (self.enabled.arp && note) {
                console.log('[Arp] Playing:', note, 'at', time);
                // Use longer duration to allow delay tail to ring out (samples can overlap)
                self.synths.arp.triggerAttackRelease(note, '1n', time);
            }
        }, arpNotes, '16n');

        // Generate drum pattern (use current pattern)
        const drumPattern = this.drumPatterns[this.currentDrumPattern].pattern;
        console.log('[ProceduralEngine] Drum pattern (' + this.drumPatterns[this.currentDrumPattern].name + '):', drumPattern);
        this.patterns.drums = new Tone.Sequence((time, note) => {
            if (self.enabled.drums && note) {
                // Apply pitch offset using Tone.Frequency.transpose (takes semitones)
                const transposedNote = Tone.Frequency(note).transpose(self.drumPitchOffset).toNote();
                console.log('[Drums] Playing:', transposedNote, 'at', time);
                self.synths.drums.triggerAttackRelease(transposedNote, '8n', time);
            }
        }, drumPattern, '8n');

        // Start all patterns
        this.startPatterns();
    }

    // Generate bass pattern (root notes, lower octave)
    generateBassPattern() {
        const bassOctave = '2';
        const style = this.styles[this.currentStyle];
        const bassPattern = this.randomChoice(style.bassPatterns);

        // Get chord progression from current style
        const chordProg = this.randomChoice(style.chordProgressions);
        const root = this.scaleNotes[chordProg[0]] + bassOctave;

        // Different patterns based on style
        if (bassPattern === 'minimal' || bassPattern === 'sustained') {
            // Minimal: mostly root, sparse
            return [root, null, null, null, root, null, null, null];
        } else if (bassPattern === 'pulsing' || bassPattern === 'driving') {
            // Pulsing: steady 8th notes on root
            return [root, null, root, null, root, null, root, null];
        } else if (bassPattern === 'rolling') {
            // Rolling: root with some fifths
            const fifth = this.scaleNotes[chordProg[0] + 4] ? this.scaleNotes[(chordProg[0] + 4) % 7] + bassOctave : root;
            return [root, fifth, root, null, root, fifth, root, null];
        } else {
            // Default: root-fifth pattern (groovy, funky, root-fifth)
            const fifth = this.scaleNotes[chordProg[0] + 4] ? this.scaleNotes[(chordProg[0] + 4) % 7] + bassOctave : root;
            return [root, null, fifth, null, root, null, fifth, null];
        }
    }

    // Generate pad pattern (chords)
    generatePadPattern() {
        const chordOctave = '3';
        const style = this.styles[this.currentStyle];

        // Get random chord progression from style
        const chordProg = this.randomChoice(style.chordProgressions);

        // Build triads from the progression
        const chords = chordProg.map(degree => {
            // Build triad: root, third, fifth
            const root = this.scaleNotes[degree % 7];
            const third = this.scaleNotes[(degree + 2) % 7];
            const fifth = this.scaleNotes[(degree + 4) % 7];

            return [
                root + chordOctave,
                third + chordOctave,
                fifth + chordOctave
            ];
        });

        return chords;
    }

    // Generate arp pattern (melodic notes)
    generateArpPattern() {
        const arpOctave = '3';  // Match your sample range (C3-C4)
        const style = this.styles[this.currentStyle];
        const arpPattern = this.randomChoice(style.arpPatterns);

        const scaleWithOctave = this.scaleNotes.map(note => note + arpOctave);

        // Different patterns based on style
        if (arpPattern === 'arpeggiated' || arpPattern === 'fast-arpeggiated') {
            // Classic arpeggio: 1-3-5-3 repeated
            return [
                scaleWithOctave[0], scaleWithOctave[2], scaleWithOctave[4], scaleWithOctave[2],
                scaleWithOctave[0], scaleWithOctave[2], scaleWithOctave[4], scaleWithOctave[2],
                scaleWithOctave[0], scaleWithOctave[2], scaleWithOctave[4], scaleWithOctave[2],
                scaleWithOctave[0], scaleWithOctave[2], scaleWithOctave[4], scaleWithOctave[2]
            ];
        } else if (arpPattern === 'melodic' || arpPattern === 'uplifting') {
            // Melodic: ascend and descend
            return [
                scaleWithOctave[0], scaleWithOctave[2], scaleWithOctave[4], scaleWithOctave[5],
                scaleWithOctave[4], scaleWithOctave[2], scaleWithOctave[0], null,
                scaleWithOctave[0], scaleWithOctave[2], scaleWithOctave[4], scaleWithOctave[6],
                scaleWithOctave[4], scaleWithOctave[2], scaleWithOctave[0], null
            ];
        } else if (arpPattern === 'stabs' || arpPattern === 'minimal') {
            // Stabs: sparse, rhythmic hits
            return [
                scaleWithOctave[0], null, null, null,
                scaleWithOctave[4], null, null, null,
                scaleWithOctave[2], null, null, null,
                scaleWithOctave[0], null, null, null
            ];
        } else if (arpPattern === 'sparse' || arpPattern === 'atmospheric') {
            // Sparse: very minimal, atmospheric
            return [
                scaleWithOctave[0], null, null, null, null, null, null, null,
                scaleWithOctave[4], null, null, null, null, null, null, null
            ];
        } else {
            // Default: rhythmic pattern
            return [
                scaleWithOctave[0], scaleWithOctave[2], scaleWithOctave[4], null,
                scaleWithOctave[2], null, scaleWithOctave[0], null,
                scaleWithOctave[4], scaleWithOctave[2], scaleWithOctave[0], null,
                null, null, null, null
            ];
        }
    }

    // Start all pattern sequences
    startPatterns() {
        console.log('[ProceduralEngine] Starting all patterns...');
        if (this.patterns.bass) {
            this.patterns.bass.start(0);
            console.log('[ProceduralEngine] Bass pattern started');
        }
        if (this.patterns.pad) {
            this.patterns.pad.start(0);
            console.log('[ProceduralEngine] Pad pattern started');
        }
        if (this.patterns.arp) {
            this.patterns.arp.start(0);
            console.log('[ProceduralEngine] Arp pattern started');
        }
        if (this.patterns.drums) {
            this.patterns.drums.start(0);
            console.log('[ProceduralEngine] Drums pattern started');
        }
        console.log('[ProceduralEngine] All patterns started');
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
        console.log('[ProceduralEngine] Audio context state:', Tone.context.state);

        this.isPlaying = true;

        // Set tempo
        Tone.Transport.bpm.value = 90;
        Tone.Transport.start();

        console.log('[ProceduralEngine] Transport started at BPM:', Tone.Transport.bpm.value);

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

    // Set BPM/Tempo
    setBPM(bpm) {
        Tone.Transport.bpm.value = bpm;
        console.log('[ProceduralEngine] BPM set to:', bpm);
    }

    // Cycle to next drum pattern
    nextDrumPattern() {
        this.currentDrumPattern = (this.currentDrumPattern + 1) % this.drumPatterns.length;
        const patternName = this.drumPatterns[this.currentDrumPattern].name;
        console.log('[ProceduralEngine] Drum pattern changed to:', patternName);

        // Regenerate drum pattern if playing
        if (this.isPlaying) {
            const self = this;
            const drumPattern = this.drumPatterns[this.currentDrumPattern].pattern;

            // Stop old pattern
            if (this.patterns.drums) {
                this.patterns.drums.stop();
                this.patterns.drums.dispose();
            }

            // Create new pattern
            this.patterns.drums = new Tone.Sequence((time, note) => {
                if (self.enabled.drums && note) {
                    // Apply pitch offset using Tone.Frequency.transpose (takes semitones)
                    const transposedNote = Tone.Frequency(note).transpose(self.drumPitchOffset).toNote();
                    console.log('[Drums] Playing:', transposedNote, 'at', time);
                    self.synths.drums.triggerAttackRelease(transposedNote, '8n', time);
                }
            }, drumPattern, '8n');

            this.patterns.drums.start(0);
        }

        return patternName;
    }

    // Set drum pitch offset (in semitones)
    setDrumPitch(semitones) {
        this.drumPitchOffset = semitones;
        console.log('[ProceduralEngine] Drum pitch offset set to:', semitones, 'semitones');
    }

    // Change style and regenerate
    setStyle(styleName) {
        if (!this.styles[styleName]) {
            console.error('[ProceduralEngine] Unknown style:', styleName);
            return;
        }

        this.currentStyle = styleName;
        const style = this.styles[styleName];

        // Set BPM from style's range
        const bpm = this.randomInRange(style.bpmRange[0], style.bpmRange[1]);
        this.setBPM(bpm);

        // Pick a random compatible drum pattern from style
        const drumPatternIndex = this.randomChoice(style.drumPatterns);
        this.currentDrumPattern = drumPatternIndex;

        console.log('[ProceduralEngine] Style changed to:', style.name, '| BPM:', bpm);

        // Regenerate patterns if playing
        if (this.isPlaying) {
            this.regeneratePatterns();
        }

        return { style: style.name, bpm: bpm, drumPattern: this.drumPatterns[drumPatternIndex].name };
    }

    // Helper: pick random element from array
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // Helper: random number in range (inclusive)
    randomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
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

    // Get UI elements
    const playPauseBtn = document.getElementById('playPause');
    const keySelect = document.getElementById('keySelect');
    const styleSelect = document.getElementById('styleSelect');
    const regenerateBtn = document.getElementById('regenerateBtn');
    const bpmSlider = document.getElementById('bpmSlider');
    const bpmValue = document.getElementById('bpmValue');
    const drumPatternBtn = document.getElementById('drumPatternBtn');

    // Initialize default style
    const initialStyle = engine.setStyle('synthwave');
    if (initialStyle) {
        bpmSlider.value = initialStyle.bpm;
        bpmValue.textContent = initialStyle.bpm;
        drumPatternBtn.textContent = initialStyle.drumPattern;
    }

    updateStatus('Ready - Click Start to generate music');

    // Play/Pause Button
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
    keySelect.addEventListener('change', (e) => {
        engine.updateScale(e.target.value);
        updateStatus('Changed to ' + e.target.value);
    });

    // Style Selection
    styleSelect.addEventListener('change', (e) => {
        const result = engine.setStyle(e.target.value);
        if (result) {
            bpmSlider.value = result.bpm;
            bpmValue.textContent = result.bpm;
            drumPatternBtn.textContent = result.drumPattern;
            updateStatus('Style: ' + result.style + ' | BPM: ' + result.bpm);
        }
    });

    // Regenerate Button
    regenerateBtn.addEventListener('click', () => {
        if (engine.isPlaying) {
            engine.regeneratePatterns();
            updateStatus('Regenerated new patterns');
        } else {
            updateStatus('Start playback first');
        }
    });

    // BPM/Tempo Control
    bpmSlider.addEventListener('input', (e) => {
        const bpm = parseInt(e.target.value);
        engine.setBPM(bpm);
        bpmValue.textContent = bpm;
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

    // Drum Pattern Button
    drumPatternBtn.addEventListener('click', () => {
        const patternName = engine.nextDrumPattern();
        drumPatternBtn.textContent = patternName;
    });

    // Drum Pitch Control
    const drumPitch = document.getElementById('drumPitch');
    const drumPitchValue = document.getElementById('drumPitchValue');
    drumPitch.addEventListener('input', (e) => {
        const semitones = parseInt(e.target.value);
        engine.setDrumPitch(semitones);
        drumPitchValue.textContent = semitones > 0 ? '+' + semitones : semitones;
    });

    console.log('[VibeCoding2] Initialization complete');
});
