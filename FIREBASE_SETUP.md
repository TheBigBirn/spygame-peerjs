# Firebase Setup for Online Rooms

Online multiplayer requires Firebase Realtime Database with proper security rules. **If rooms don't load or you see "Database access denied", you must deploy these rules.**

## Quick Fix (Firebase Console)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Open project **spygame-fa5d0**
3. Click **Realtime Database** in the left menu
4. Click the **Rules** tab
5. Replace the rules with:

```json
{
  "rules": {
    "rooms": {
      ".read": true,
      ".write": true
    }
  }
}
```

6. Click **Publish**

## Deploy via CLI (alternative)

```bash
npm install -g firebase-tools
firebase login
firebase init database
firebase deploy --only database
```

## Verify

After deploying, switch to Online mode in the app. You should see the room list (or "No rooms available"). Create a room to test.
