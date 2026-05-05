# Security Specification

## Data Invariants
1. Users can only create their own user profile if the UID matches their auth UID.
2. Users can only update their own safe profile fields (name, phone, avatarUrl).
3. Only admins can update privileged fields (role, shiftId, isBanned).
4. Attendance records must belong to the caller (`request.auth.uid`), unless the caller is an Admin.
5. `allow list` operations must strictly ensure `resource.data.userId == request.auth.uid` instead of relying on the client's query, unless the caller is an Admin.
6. The `photoBase64` string must be restricted to a reasonable size (e.g., 2MB) to prevent Denial of Wallet.
7. Settings are immutable by regular users and read-only for authentication users.
8. Banned users (`isBanned == true`) cannot perform writes (create/update) for their own attendance or leave requests.

## The "Dirty Dozen" Payloads
1. User creates a user doc with someone else's `uid`.
2. User updates their own `role` to 'superadmin'.
3. User updates their own `isBanned` to `false`.
4. User queries `attendance` without checking their own `userId`.
5. User queries `leaveRequests` without checking their own `userId`.
6. User creates an attendance record for someone else's `userId`.
7. User uploads a 10MB `photoBase64`.
8. User modifies an `attendance` record to `status: 'approved'`.
9. Admin attempts to update global settings. (Allowed)
10. Unauthenticated user tries to read Settings. (Should fail, or allowed for login? Need to check if auth is needed).
11. Banned user tries to create an attendance record.
12. User leaves `method` out of the attendance payload.
