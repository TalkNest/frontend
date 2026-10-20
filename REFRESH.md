# TalkNest interface refresh

`src/refresh/Workspace.js` is the current entry point; legacy components are
retained as reference. Do not import legacy Firebase initialization into the new
entry point: it assumes unavailable configuration and enables Analytics.

## Local preview

```
npm ci --ignore-scripts
HOST=127.0.0.1 PORT=3046 BROWSER=none npm start
```

Open `http://127.0.0.1:3046/?demo=1`. This is an explicitly labeled local demo.
Messages stay in React memory, no person is contacted, and the call preview
does not request microphone or camera permissions.

## Connected deployment

Copy `.env.example` into local configuration or enter the five public values in
Render's static-site build environment. Firebase's web configuration is public;
**service-account private keys do not belong in any REACT_APP_ variable**.

Build: `npm ci --ignore-scripts && npm run build`
Publish directory: `build`; rewrite `/*` to `/index.html`.

Absent required configuration, the page stays in preview mode. This is intentional
and does **not** mean the real messaging backend is connected.

Connected users opt into the name directory. Email addresses are not returned
by directory APIs. The profile link can use `/?connect=Yuqi%20Guo` to prefill a
directory search after sign-in; it never automatically sends a message or call.

The refreshed UI supports text messages, audio/video call initiation,
accept/decline, mute, camera toggle and explicit end/disconnect states.
Files/photos and history pagination beyond the latest 100 messages are deferred.
The backend's DEPLOYMENT.md documents Firebase rules and STUN/TURN limitations.

## Checks

```
CI=true npm test -- --watchAll=false --runInBand
CI=true npm run build
```

Browser checks should cover desktop/mobile, keyboard focus, message retry,
call preview, and real two-account media on the deployed configuration.
