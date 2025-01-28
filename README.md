# surveysparrow-ionic-plugin

SurveySparrow SDK enables you to collect feedback from your mobile app. Embed the Classic, Chat & NPS surveys in your Ionic application seamlessly with few lines of code.

## Install

```bash
npm install surveysparrow-ionic-plugin
npx cap sync
```

## Permissions Required

To use this plugin, ensure the following permissions are added to your app:

### Android

Add these permissions to your `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### iOS

Add the necessary permissions to your `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to capture photos and videos.</string>
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access to record audio.</string>
```

### General Note

Based on the survey type being used, ensure the necessary permissions (e.g., for photos, videos, audio, or storage) are added to your app's configuration.

## API

  [loadFullScreenSurvey(...)](#loadfullscreensurvey)
  
  [loadFullScreenSurveyWithValidation(...)](#loadfullscreensurveywithvalidation)

### loadFullScreenSurvey(...)

```typescript
loadFullScreenSurvey(options: { domain: String; token: String; params: Object; properties: Object; }) => Promise<void>
```

| Param         | Type                                                                                                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`options`** | <code>{ domain: <a href="#string">String</a>; token: <a href="#string">String</a>; params: <a href="#object">Object</a>; properties: <a href="#object">Object</a>; }</code> |

--------------------

### loadFullScreenSurveyWithValidation(...)

```typescript
loadFullScreenSurveyWithValidation(options: { domain: String; token: String; params: Object; properties: Object; }) => Promise<void>
```

| Param         | Type                                                                                                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`options`** | <code>{ domain: <a href="#string">String</a>; token: <a href="#string">String</a>; params: <a href="#object">Object</a>; properties: <a href="#object">Object</a>; }</code> |

--------------------

## Support
For questions or issues, contact us at [support@surveysparrow.com](mailto:support@surveysparrow.com).