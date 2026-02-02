# MIDI Pattern System

This folder contains MIDI patterns for the VibeCoding 2 MIDI-based bass pattern system.

## How to Use

### 1. Export MIDI from Your DAW
- Record or program your bass pattern in your DAW
- Export as MIDI file (.mid format)
- Place the file in the `audio/midi/bass/` folder

### 2. Register Your Pattern
Edit `patterns-manifest.json` and add your pattern:

```json
{
  "bass": [
    {
      "name": "Your Pattern Name",
      "url": "audio/midi/bass/your-file.mid",
      "description": "Description of the pattern",
      "defaultVariationIndices": [0, 2, 4, 6]
    }
  ]
}
```

### 3. Use in VibeCoding 2
1. Open the app in your browser
2. In the Bass section, change "Pattern Mode" from "Procedural" to "MIDI Pattern"
3. Select your pattern from the dropdown
4. The pattern will automatically:
   - Transpose to the current scale/key
   - Apply variations to specified note positions (if enabled)
   - Preserve the original rhythm and feel

## Variation System

The `defaultVariationIndices` array specifies which note positions can be randomly varied:
- `[0, 2, 4, 6]` = 1st, 3rd, 5th, and 7th notes will vary
- `[0, 4, 8, 12]` = Every 4th note varies
- `[]` = No variation (pattern plays exactly as recorded)

You can adjust these in real-time using the "Variation Indices" input field.

## Tips

- **Best Results**: Use 16th note patterns (1 bar)
- **Rhythm Preservation**: The system keeps your exact timing and note durations
- **Velocity**: Original MIDI velocities are preserved
- **Transposition**: Notes are intelligently mapped to the current scale
- **Multiple Patterns**: Create variations of the same pattern and switch between them live

## Folder Structure

```
audio/midi/
├── patterns-manifest.json    # Registry of all patterns
├── bass/                     # Bass MIDI patterns (you add files here)
├── drums/                    # (Future: drum patterns)
└── melody/                   # (Future: melody patterns)
```

## Example Workflow

1. Play a funky 16th note bass line in Ableton/Logic/FL Studio
2. Export as MIDI: `funky-bass-1.mid`
3. Copy to `audio/midi/bass/`
4. Add to manifest with name "Funky Bass 1"
5. Load in VibeCoding 2 and it will play in any key/scale!
