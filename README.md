# Camera-Based AI Exercise Rep Counter

Expo + React Native proof of concept that uses the phone camera and **Google MediaPipe Pose Landmarker** to learn user-defined exercises and count repetitions.

Users create an exercise name, demonstrate ~3–5 reps during calibration, then start the camera again to count matching repetitions. Profiles stay in memory only (recalibrate after restart).

## Stack

- Expo SDK 53 (development build — **not Expo Go**)
- React Native Vision Camera v4 + worklets
- `react-native-mediapipe-posedetection` (MediaPipe Pose Landmarker)
- TypeScript joint-angle features + Dynamic Time Warping (DTW)
- `pose_landmarker_lite.task` bundled via Expo config plugin

## Requirements

- Node.js 20+ (22+ recommended)
- Android Studio / SDK for Android builds (primary target on Windows)
- A **physical phone** with USB debugging (camera + GPU pose inference)
- Xcode only if building for iOS on a Mac

## Setup

```bash
npm install
```

Confirm the model exists at:

`assets/models/pose_landmarker_lite.task`

If missing, download it:

```bash
# PowerShell
Invoke-WebRequest `
  -Uri "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task" `
  -OutFile "assets/models/pose_landmarker_lite.task"
```

Generate native projects and install the app:

```bash
npx expo prebuild
npx expo run:android
# or on macOS:
npx expo run:ios
```

Then start Metro if needed:

```bash
npx expo start --dev-client
```

## How to use

1. Open the app and enter an exercise name (e.g. `Bicep Curls`).
2. Tap **Create & Calibrate**.
3. Stand fully in frame until the green skeleton overlay tracks you.
4. Tap **Start**, perform **3–5 slow, complete repetitions**, then tap **Finish**.
5. On the home screen, tap **Count: …** for that exercise.
6. Tap **Start** and repeat the same movement — reps increment automatically.

## Testing notes

### Bicep curls

- Side-on or slight ¾ view so shoulder, elbow, and wrist are visible.
- Full extension → full curl each rep.
- The learning engine should weight elbow angles highest.

### Sit-ups

- Side view so torso travel is clear (shoulder/hip landmarks).
- Lie flat → sit up fully → return each rep.
- The engine should weight torso lean / hip angles highest.

### Accuracy tips

- Keep the whole body (or at least the moving joints) in frame.
- Calibrate and count in similar lighting and camera distance.
- Avoid bouncing or partial reps during calibration.
- If false counts appear, recalibrate with slower, cleaner reps (raises the DTW threshold quality).
- If reps are missed, perform fuller range of motion; amplitude gating rejects small fidgets.

## Architecture (short)

1. Vision Camera frames → MediaPipe Pose Landmarker (33 landmarks).
2. Landmarks → joint-angle feature vector (elbows, shoulders, hips, knees, torso lean).
3. Calibration segments reps, DTW-aligns them, stores a weighted template + confidence threshold.
4. Counting uses a primary-channel state machine (`idle → leaving → peak → returning`) and accepts a rep only when amplitude and DTW distance both pass.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm start` | Metro bundler (dev client) |
| `npm run prebuild` | Generate `android/` / `ios/` |
| `npm run android` | Build & run on Android |
| `npm run ios` | Build & run on iOS |

## Out of scope

No database, backend, settings menus, or branded UI — this prototype focuses on camera tracking, calibration, recognition, and counting.
