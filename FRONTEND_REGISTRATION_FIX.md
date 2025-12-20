# Frontend Registration Button Fix

## Issue
The "Register" button on the Event Channel Dashboard and Event Card was "blinking" (showing "Registered" briefly then reverting to "Register") after a successful registration.

## Cause
The `useEffect` hook responsible for checking the user's registration status (`checkRegistration`) had `user` object as a dependency.
The `user` object was being recreated on every render of the parent component (due to `const user = authUser ? { ...authUser, ... } : null`).
When the user clicked "Register", the component would update the local state to "Registered" (optimistic UI).
However, the registration action also triggered a parent re-render (via `onEventUpdate` or other state changes).
This parent re-render created a new `user` object reference.
The `useEffect` in the child component detected the `user` change and re-ran `checkRegistration`.
`checkRegistration` fetched the registration list from the backend.
Due to eventual consistency or timing, the backend might return the old list (without the new registration) immediately after the write.
This caused `checkRegistration` to set the local state back to "Not Registered", overwriting the optimistic update.

## Fix
Updated the `useEffect` dependency array in `src/Components/EventChannel/EventChannelDashboard.js` and `src/Components/UserDashboard/EventCard.js`.
Changed `[event.id, user]` (or `[evt.id, user]`) to `[event.id, user?.id]`.
This ensures the effect only runs when the user's ID actually changes (e.g., login/logout), not when the object reference changes.

## Files Modified
- `src/Components/EventChannel/EventChannelDashboard.js`
- `src/Components/UserDashboard/EventCard.js`
