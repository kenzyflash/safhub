

## Fix: Discussion Tab "Failed to load discussions" Error

### Root Cause
The `CourseDiscussion` component calls `fetchDiscussions()` on mount, even when the user session hasn't loaded yet. The `get_course_discussions_secure` DB function checks enrollment using `auth.uid()`, which is null for unauthenticated requests — causing it to raise "Access denied. Course enrollment required." The error toast fires on this first attempt, and even though the useEffect re-runs when `user` becomes available, the damage is done.

### Fix
In `src/components/course/CourseDiscussion.tsx`, add a guard at the top of `fetchDiscussions()` to skip the call when `user` is null. This way the RPC only runs once the user session is available.

```typescript
const fetchDiscussions = async () => {
  if (!user) {
    setLoading(false);
    return;
  }
  // ... rest of function
};
```

### Files Changed
- **`src/components/course/CourseDiscussion.tsx`** — add early return when `user` is null

### Verification
Open a course's Discussion tab while logged in and confirm discussions load without error.

