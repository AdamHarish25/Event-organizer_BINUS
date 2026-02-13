# Backend Error Report: Logout TypeError

## Issue Description
A `TypeError` occurs during the user logout process when the refresh token is missing from the request (e.g., cookie already cleared or expired).

**Error Message:**
```
TypeError [ERR_INVALID_ARG_TYPE]: The "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView. Received null
```

## Location
*   **File:** `backend/service/token.service.js`
*   **Function:** `revokeRefreshToken`
*   **Line:** ~269 (call to `hashToken`)

## Root Cause
The `revokeRefreshToken` function attempts to hash the `refreshTokenFromUser` without checking if it exists.
```javascript
// backend/service/token.service.js

export const revokeRefreshToken = async (refreshTokenFromUser, ...) => {
    // ...
    // CRASH HERE if refreshTokenFromUser is null
    const tokenHash = hashToken(refreshTokenFromUser); 
    // ...
}
```
When `req.cookies.refreshToken` is undefined (which is common if the user is already logged out or the cookie expired), `refreshTokenFromUser` is passed as `null`, causing `crypto.createHash(...).update(null)` to throw.

## Impact Assessment
*   **Severity:** Low / Cosmetic.
*   **User Experience:** Unaffected. The user is successfully logged out.
*   **System Stability:** Safe. The error is caught by `Promise.allSettled` in `handleUserLogout` (`backend/service/auth.service.js`), preventing the request from failing. The Access Token is still successfully blacklisted.

## Recommended Fix
Add a guard clause at the beginning of `revokeRefreshToken` to skip execution if no token is provided.

```javascript
export const revokeRefreshToken = async (refreshTokenFromUser, userId, logoutLogger) => {
    if (!refreshTokenFromUser) {
        logoutLogger.info("Skipping refresh token revocation: No token provided");
        return;
    }
    // ... existing logic ...
}
```
