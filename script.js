// VibeCoding 2 - Procedural Music Generator
// Using Tone.js for audio and Tonal.js for music theory

class ProceduralMusicEngine {
    constructor() {
        this.isPlaying = false;
        this.currentScale = 'A minor';
        this.scaleNotes = [];
        this.currentDrumPattern = 0; // Defaults to 4-on-Floor
        this.drumPitchOffset = 0;
        this.currentStyle = 'synthwave';
        this.bassRhythmOverride = '16th'; // User's manual rhythm selection
        this.useMarkovChain = false;
        this.useEuclideanRhythm = false;
        this.euclideanPulses = 4;
        this.euclideanSteps = 16;

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
                bassPatterns: ['trance-16ths', 'rolling'],
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

        // Common chord progressions for Markov chain training (scale degrees)
        this.markovTrainingData = [
            // Classic progressions
            [0, 5, 3, 6], [0, 3, 6, 5], [0, 5, 6, 4], [0, 4, 5, 3],
            // Pop progressions
            [0, 5, 3, 4], [0, 3, 5, 6], [0, 6, 3, 5], [0, 4, 5, 0],
            // EDM progressions
            [0, 0, 3, 0], [0, 6, 0, 6], [0, 3, 0, 3], [0, 5, 3, 6],
            // Minor key classics
            [0, 6, 3, 6], [0, 3, 6, 0], [0, 5, 3, 5], [0, 6, 4, 5],
            // Extended progressions
            [0, 5, 3, 6, 4, 5], [0, 3, 6, 5, 0, 4], [0, 6, 3, 5, 4, 0]
        ];

        // Train Markov chain on initialization
        this.chordTransitions = this.learnChordProgressions(this.markovTrainingData);
        console.log('[ProceduralEngine] Markov chain trained on', this.markovTrainingData.length, 'progressions');
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
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.001, decay: 0.34, sustain: 0.01, release: 0 }
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
        const bassData = this.generateBassPattern();
        console.log('[ProceduralEngine] Bass pattern:', bassData.pattern, 'subdivision:', bassData.subdivision);
        const self = this;
        this.patterns.bass = new Tone.Sequence((time, note) => {
            if (self.enabled.bass && note) {
                console.log('[Bass] Playing:', note, 'at', time);
                self.synths.bass.triggerAttackRelease(note, '4n', time);
            }
        }, bassData.pattern, bassData.subdivision);

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

        // Generate drum pattern (use Euclidean or predefined pattern)
        let drumPattern;
        if (this.useEuclideanRhythm) {
            drumPattern = this.generateEuclideanRhythm(this.euclideanPulses, this.euclideanSteps, 'C1');
            console.log('[ProceduralEngine] Euclidean drum pattern E(' + this.euclideanPulses + ',' + this.euclideanSteps + '):', drumPattern);
        } else {
            drumPattern = this.drumPatterns[this.currentDrumPattern].pattern;
            console.log('[ProceduralEngine] Drum pattern (' + this.drumPatterns[this.currentDrumPattern].name + '):', drumPattern);
        }
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

        // Get chord progression from current style
        const chordProg = this.randomChoice(style.chordProgressions);
        const root = this.scaleNotes[chordProg[0]] + bassOctave;
        const fifth = this.scaleNotes[(chordProg[0] + 4) % 7] + bassOctave;

        // Use rhythm override to determine pattern
        return this.generateBassRhythmPattern(root, fifth);

    }

    // Generate bass rhythm pattern based on user's rhythm selection
    generateBassRhythmPattern(root, fifth) {
        const rhythm = this.bassRhythmOverride;

        if (rhythm === 'whole') {
            // Whole notes: very sparse (4 positions = 4 bars)
            return {
                pattern: [root, null, null, null],
                subdivision: '1n'
            };
        } else if (rhythm === 'half') {
            // Half notes: sparse (8 positions = 4 bars)
            return {
                pattern: [root, null, root, null, root, null, root, null],
                subdivision: '2n'
            };
        } else if (rhythm === 'quarter') {
            // Quarter notes: steady (8 positions = 2 bars)
            return {
                pattern: [root, root, root, root, root, root, root, root],
                subdivision: '4n'
            };
        } else if (rhythm === '8th') {
            // 8th notes: root-fifth pattern (16 positions = 2 bars)
            return {
                pattern: [
                    root, fifth, root, fifth, root, fifth, root, fifth,
                    root, fifth, root, fifth, root, fifth, root, fifth
                ],
                subdivision: '8n'
            };
        } else if (rhythm === '16th') {
            // 16th notes: fast (32 positions = 2 bars)
            return {
                pattern: [
                    root, root, root, root, fifth, fifth, root, root,
                    root, root, root, root, fifth, fifth, root, root,
                    root, root, root, root, fifth, fifth, root, root,
                    root, root, root, root, fifth, fifth, root, root
                ],
                subdivision: '16n'
            };
        } else if (rhythm === '32nd') {
            // 32nd notes: very fast (64 positions = 2 bars)
            const pattern = [];
            for (let i = 0; i < 64; i++) {
                // Alternate root and fifth with occasional variations
                pattern.push(i % 8 < 6 ? root : fifth);
            }
            return {
                pattern: pattern,
                subdivision: '32n'
            };
        } else {
            // Default: 8th notes
            return {
                pattern: [
                    root, fifth, root, fifth, root, fifth, root, fifth,
                    root, fifth, root, fifth, root, fifth, root, fifth
                ],
                subdivision: '8n'
            };
        }
    }

    // Generate pad pattern (chords)
    generatePadPattern() {
        const chordOctave = '3';
        const style = this.styles[this.currentStyle];

        // Choose progression based on mode
        let chordProg;
        if (this.useMarkovChain) {
            // Use Markov chain to generate progression
            const startChord = 0; // Start on root
            chordProg = this.generateMarkovProgression(this.chordTransitions, startChord, 4);
            console.log('[ProceduralEngine] Markov-generated progression:', chordProg);
        } else {
            // Get random chord progression from style
            chordProg = this.randomChoice(style.chordProgressions);
        }

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

    // Set bass waveform
    setBassWaveform(waveform) {
        if (this.synths.bass && this.synths.bass.oscillator) {
            this.synths.bass.oscillator.type = waveform;
            console.log('[ProceduralEngine] Bass waveform set to:', waveform);
        }
    }

    // Set bass envelope parameters
    setBassEnvelope(param, value) {
        if (this.synths.bass && this.synths.bass.envelope) {
            if (param === 'attack') {
                this.synths.bass.envelope.attack = value / 1000; // Convert ms to seconds
            } else if (param === 'decay') {
                this.synths.bass.envelope.decay = value / 1000;
            } else if (param === 'sustain') {
                this.synths.bass.envelope.sustain = value / 100; // Convert percentage to 0-1
            } else if (param === 'release') {
                this.synths.bass.envelope.release = value / 1000;
            }
            console.log('[ProceduralEngine] Bass', param, 'set to:', value);
        }
    }

    // Set bass rhythm and regenerate pattern
    setBassRhythm(rhythm) {
        this.bassRhythmOverride = rhythm;
        console.log('[ProceduralEngine] Bass rhythm set to:', rhythm);

        // Regenerate bass pattern if playing
        if (this.isPlaying) {
            const self = this;
            const bassData = this.generateBassPattern();

            // Stop old pattern
            if (this.patterns.bass) {
                this.patterns.bass.stop();
                this.patterns.bass.dispose();
            }

            // Create new pattern
            this.patterns.bass = new Tone.Sequence((time, note) => {
                if (self.enabled.bass && note) {
                    console.log('[Bass] Playing:', note, 'at', time);
                    self.synths.bass.triggerAttackRelease(note, '4n', time);
                }
            }, bassData.pattern, bassData.subdivision);

            this.patterns.bass.start(0);
        }
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

    // Toggle Markov chain for chord progressions
    toggleMarkovChain(enabled) {
        this.useMarkovChain = enabled;
        console.log('[ProceduralEngine] Markov chain:', enabled ? 'enabled' : 'disabled');

        // Regenerate if playing
        if (this.isPlaying) {
            this.regeneratePatterns();
        }
    }

    // Toggle Euclidean rhythm for drums
    toggleEuclideanRhythm(enabled) {
        this.useEuclideanRhythm = enabled;
        console.log('[ProceduralEngine] Euclidean rhythm:', enabled ? 'enabled' : 'disabled');

        // Regenerate if playing
        if (this.isPlaying) {
            this.regeneratePatterns();
        }
    }

    // Set Euclidean rhythm parameters
    setEuclideanParams(pulses, steps) {
        this.euclideanPulses = pulses;
        this.euclideanSteps = steps;
        console.log('[ProceduralEngine] Euclidean params: E(' + pulses + ',' + steps + ')');

        // Regenerate if Euclidean is enabled and playing
        if (this.isPlaying && this.useEuclideanRhythm) {
            this.regeneratePatterns();
        }
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

    // Euclidean Rhythm Generator
    // E(k, n) - distribute k beats across n steps as evenly as possible
    generateEuclideanRhythm(pulses, steps, note = 'C1') {
        if (pulses >= steps) {
            // Every step has a beat
            return Array(steps).fill(note);
        }

        if (pulses === 0) {
            // No beats
            return Array(steps).fill(null);
        }

        // Bjorklund's algorithm
        const pattern = [];
        const counts = [];
        const remainders = [];

        let divisor = steps - pulses;
        remainders.push(pulses);

        let level = 0;
        while (remainders[level] > 1) {
            counts.push(Math.floor(divisor / remainders[level]));
            remainders.push(divisor % remainders[level]);
            divisor = remainders[level];
            level++;
        }
        counts.push(divisor);

        // Build the pattern
        const buildPattern = (level) => {
            if (level === -1) {
                pattern.push(note);
            } else if (level === -2) {
                pattern.push(null);
            } else {
                for (let i = 0; i < counts[level]; i++) {
                    buildPattern(level - 1);
                }
                if (remainders[level] !== 0) {
                    buildPattern(level - 2);
                }
            }
        };

        buildPattern(level);
        return pattern.slice(0, steps);
    }

    // Markov Chain for Chord Progressions
    learnChordProgressions(progressions) {
        // Build transition probability matrix
        const transitions = {};

        progressions.forEach(prog => {
            for (let i = 0; i < prog.length - 1; i++) {
                const current = prog[i];
                const next = prog[i + 1];

                if (!transitions[current]) {
                    transitions[current] = {};
                }
                if (!transitions[current][next]) {
                    transitions[current][next] = 0;
                }
                transitions[current][next]++;
            }
        });

        // Convert counts to probabilities
        for (const current in transitions) {
            const total = Object.values(transitions[current]).reduce((a, b) => a + b, 0);
            for (const next in transitions[current]) {
                transitions[current][next] /= total;
            }
        }

        return transitions;
    }

    // Generate chord progression using Markov chain
    generateMarkovProgression(transitions, startChord, length = 4) {
        const progression = [startChord];
        let current = startChord;

        for (let i = 1; i < length; i++) {
            if (!transitions[current]) {
                // If no transitions available, pick random from available chords
                const allChords = Object.keys(transitions);
                current = allChords[Math.floor(Math.random() * allChords.length)];
                progression.push(current);
                continue;
            }

            // Pick next chord based on probabilities
            const rand = Math.random();
            let cumulative = 0;

            for (const next in transitions[current]) {
                cumulative += transitions[current][next];
                if (rand <= cumulative) {
                    current = next;
                    break;
                }
            }

            progression.push(current);
        }

        return progression;
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

    // Markov Chain Toggle
    const useMarkov = document.getElementById('useMarkov');
    useMarkov.addEventListener('change', (e) => {
        engine.toggleMarkovChain(e.target.checked);
        updateStatus(e.target.checked ? 'Markov chain enabled' : 'Style-based progressions');
    });

    // Euclidean Rhythm Toggle
    const useEuclidean = document.getElementById('useEuclidean');
    const euclideanControls = document.getElementById('euclideanControls');
    useEuclidean.addEventListener('change', (e) => {
        engine.toggleEuclideanRhythm(e.target.checked);
        euclideanControls.style.display = e.target.checked ? 'block' : 'none';
        updateStatus(e.target.checked ? 'Euclidean rhythm enabled' : 'Pattern-based drums');
    });

    // Euclidean Rhythm Parameters
    const euclideanPulses = document.getElementById('euclideanPulses');
    const euclideanPulsesValue = document.getElementById('euclideanPulsesValue');
    euclideanPulses.addEventListener('input', (e) => {
        const pulses = parseInt(e.target.value);
        const steps = parseInt(euclideanSteps.value);
        engine.setEuclideanParams(pulses, steps);
        euclideanPulsesValue.textContent = pulses;
    });

    const euclideanSteps = document.getElementById('euclideanSteps');
    const euclideanStepsValue = document.getElementById('euclideanStepsValue');
    euclideanSteps.addEventListener('input', (e) => {
        const steps = parseInt(e.target.value);
        const pulses = parseInt(euclideanPulses.value);
        engine.setEuclideanParams(pulses, steps);
        euclideanStepsValue.textContent = steps;
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

    // Bass Waveform Selector
    const bassWaveform = document.getElementById('bassWaveform');
    bassWaveform.addEventListener('change', (e) => {
        engine.setBassWaveform(e.target.value);
    });

    // Bass Rhythm Selector
    const bassRhythm = document.getElementById('bassRhythm');
    bassRhythm.addEventListener('change', (e) => {
        engine.setBassRhythm(e.target.value);
    });

    // Bass ADSR Controls
    const bassAttack = document.getElementById('bassAttack');
    const bassAttackValue = document.querySelector('#bassAttack + .adsr-value');
    bassAttack.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        engine.setBassEnvelope('attack', value);
        bassAttackValue.textContent = value + 'ms';
    });

    const bassDecay = document.getElementById('bassDecay');
    const bassDecayValue = document.querySelector('#bassDecay + .adsr-value');
    bassDecay.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        engine.setBassEnvelope('decay', value);
        bassDecayValue.textContent = value + 'ms';
    });

    const bassSustain = document.getElementById('bassSustain');
    const bassSustainValue = document.querySelector('#bassSustain + .adsr-value');
    bassSustain.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        engine.setBassEnvelope('sustain', value);
        bassSustainValue.textContent = value + '%';
    });

    const bassRelease = document.getElementById('bassRelease');
    const bassReleaseValue = document.querySelector('#bassRelease + .adsr-value');
    bassRelease.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        engine.setBassEnvelope('release', value);
        bassReleaseValue.textContent = value + 'ms';
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

    // Tab Navigation
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            // Remove active class from all buttons and tabs
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding tab
            button.classList.add('active');
            document.getElementById(targetTab + 'Tab').classList.add('active');

            console.log('[VibeCoding2] Switched to', targetTab, 'tab');
        });
    });

    console.log('[VibeCoding2] Initialization complete');
});
