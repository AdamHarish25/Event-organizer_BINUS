# Backend Error Report: Missing Logger Argument in `uploadPosterImage`

## Error Description
The application crashes with a `TypeError: Cannot read properties of undefined (reading 'error')` when attempting to edit an event with a new image.

**Location:** `backend/service/upload.service.js:42:20`

## Root Cause Analysis
The `uploadPosterImage` function in `upload.service.js` expects three arguments: `(buffer, options, logger)`.

However, in `backend/service/event.service.js`, inside the `editEventService` function, `uploadPosterImage` is called with only **two** arguments (missing `logger`).

### Code Reference

**`backend/service/upload.service.js` (Definition)**
```javascript
export const uploadPosterImage = (buffer, options, logger) => { // Expects logger
    // ...
    try {
        logger.info(...) // <--- Fails here first, caught by catch block
    } catch (setupError) {
        logger.error(...) // <--- Fails here again (line 42), causing the crash
    }
}
```

**`backend/service/event.service.js` (Call Site)**
```javascript
// Around line 657
uploadResult = await uploadPosterImage(image.buffer, {
    folder: fullFolderPath,
    public_id: fileName,
}); // <--- MISSING logger argument
```

## Recommended Fix
Update the call in `backend/service/event.service.js` to pass the `logger` instance.

```javascript
// backend/service/event.service.js

uploadResult = await uploadPosterImage(image.buffer, {
    folder: fullFolderPath,
    public_id: fileName,
}, logger); // <--- Add this
```
