# Key Kalimba

Welcome to Key Kalimba, your go-to app for **playing and tuning** the kalimba. Whether you're a beginner or an experienced player, this app is meticulously crafted to enhance your Kalimba learning experience.

Recently modernized into a high-performance React/Vite application, Key Kalimba features an Apple-inspired frosted glass design, perfect mathematical audio-visual synchronization, and device-independent physical scaling.

## Features & Usage

1. **Dynamic Physical Scaling**: Optimize your practice by adjusting the visual Scale of the application to match the physical dimensions of any size Kalimba. The on-screen UI will mathematically scale using your browser's persistent storage so the digital keys match the physical width of your real 17-key Kalimba when mounted onto your specific tablet or mobile device.
2. **Select a File**: Choose your favorite `.mid` song or exercise effortlessly using the built-in file selector.
3. **Perfect Audio-Visual Sync**: Dive into your Kalimba practice session with falling tiles that strike the keys in perfect, millisecond-accurate rhythm with the audio. Guaranteed zero-latency drift on Apple/iOS hardware between physical strike and key lighting.
4. **Z-Index Waterfall Physics & 3D Stacking**: Notes slide and despawn gracefully *underneath* the metal Kalimba tines, and feature 3D-beveled glass visual stacking when rapid notes overlap.
5. **Interactive YouTube-Style Scrubber**: A minimal dynamic loading bar gives you flawless timeline traversal. Skip through dense massive MIDI tracks and it automatically mutes audio loops and cleans the screen without glitching.
6. **Tempo, Tuning, & Controls**: Adjust the learning speed dynamically, toggle note numbers/dots (`# 123`), choose flat/sharp alternate tunings for the layout, and experience automatic pause/loop functionality effortlessly.
7. **DSP Chromatic Tuner**: Tap any key in tuning mode to tune your physical Kalimba using your device microphone. Powered by an autocorrelation engine with rolling median noise filtering and exponential moving average (EMA) smoothing for stable readings. Features an 1.8s persistence hold timer and permanent on-board memory so you can comfortably track your full instrument tuning progress at a glance.

## Screenshots

| Playing Mode | Tuning Mode |
|---|---|
| ![Main Interface](screenshots/main.png?raw=true) | ![Tuning Mode](screenshots/tuning.png?raw=true) |

## Local Development

Key Kalimba is built with a modern web stack: **React (TypeScript), Vite, and Vanilla CSS**.

To run the application locally:
```bash
# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

## Libraries & Attributes

Key Kalimba harnesses the power of the following libraries:
- [React](https://react.dev/) & [Vite](https://vitejs.dev/) - For lightning-fast UI rendering and development.
- [Lucide React](https://lucide.dev/) - Beautiful, consistent iconography.
- [MidiPlayerJS](https://github.com/grimmdude/MidiPlayerJS): A versatile MIDI player for seamless integration of MIDI files.
- [soundfont-player](https://github.com/danigb/soundfont-player): Enhance your kalimba sounds with this flexible SoundFont player.

The default `sample.mid` piece included natively in the application is [Kalimba Experiments One](https://musescore.com/user/38202511/scores/6738980), composed by Januaryisashape, licensed under Attribution.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE) - see the [LICENSE](LICENSE) file for details.

Feel the rhythm, embrace the melody, and let Key Kalimba be your companion on your musical journey!
