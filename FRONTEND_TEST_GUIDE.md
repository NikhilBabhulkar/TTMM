# Frontend Testing Guide - New Features

## Prerequisites
- Backend running on http://localhost:5000
- Frontend running on http://localhost:3000
- Login credentials: alice@example.com / Password123

## Test Checklist

### 1. View Group Details
- [ ] Go to Dashboard (http://localhost:3000/dashboard)
- [ ] Click on any group card
- [ ] Verify you see:
  - Group name and creator
  - List of members
  - List of expenses
  - "Add Expense" button
  - "View Activity History" button
  - "Delete Group" button (only if you're the creator)
  - "Back to Dashboard" button

### 2. Edit Expense
- [ ] From Group Detail page, find an expense
- [ ] Click the "Edit" button next to the expense
- [ ] Verify you're redirected to /expenses/:id/edit
- [ ] Change the amount or description
- [ ] Click "Update Expense"
- [ ] Verify you're redirected back to the group page
- [ ] Verify the expense shows the updated values

### 3. Delete Expense
- [ ] From Group Detail page, find an expense
- [ ] Click the "Delete" button
- [ ] Confirm the deletion in the popup
- [ ] Verify the expense disappears from the list

### 4. View Activity History
- [ ] From Group Detail page, click "View Activity History"
- [ ] Verify you see a list of all actions in that group:
  - Group creation
  - Member additions
  - Expense creation/updates/deletions
- [ ] Each activity should show:
  - Icon and colored badge
  - Description of the action
  - Who performed it
  - When it happened
  - Group name (if applicable)

### 5. Delete Group
- [ ] From Group Detail page (as creator), click "Delete Group"
- [ ] Confirm the deletion in the popup
- [ ] Verify you're redirected to Dashboard
- [ ] Verify the group no longer appears in your groups list

## Common Issues

### Issue: "View Details" button doesn't work
**Solution**: Make sure you're clicking on the group card itself, not just the "View Details" button in the balance section.

### Issue: Page shows "Loading..." forever
**Possible causes**:
1. Backend not running - check http://localhost:5000/health
2. Network error - check browser console (F12)
3. Authentication expired - try logging out and back in

### Issue: Can't see "Delete Group" button
**Reason**: Only the group creator can delete groups. Try with a group you created.

### Issue: Edit/Delete buttons don't appear
**Solution**: Make sure you're logged in and viewing a group you're a member of.

## Browser Console Debugging

Open browser console (F12) and check for:
- Network errors (red in Network tab)
- JavaScript errors (red in Console tab)
- Failed API calls (look for 401, 403, 404, 500 status codes)

## API Endpoints Reference

All new endpoints:
- `DELETE /groups/:id` - Delete a group
- `PUT /expenses/:id` - Update an expense
- `GET /activity` - Get user's activity history
- `GET /activity/group/:id` - Get group's activity history
