# Action Items Integration Test

This test validates that the Todo List (Action Items) functionality works as expected.

## Running the Test

### IMPORTANT: Restart Emulators First!

**The Firestore emulator must be restarted after updating `firestore.rules` to load the new rules.**

1. **Stop your current emulators** (Ctrl+C in the terminal running them)

2. **Restart emulators**:

   ```bash
   firebase emulators:start --only firestore,auth,storage
   ```

3. **In a new terminal, run the test**:
   ```bash
   npx jest --runInBand tests/integration/action_items.test.ts
   ```

### Option 2: Let Emulators Start Automatically

```bash
npm run test:emul -- "jest --runInBand tests/integration/action_items.test.ts"
```

This will start emulators, run the test, and shut them down automatically.

## What the Test Covers

- ✅ **CRUD Operations**: Create, read, update, delete action items
- ✅ **Status Updates**: Toggle between pending and completed
- ✅ **Completion Tracking**: Tracks completion date and user
- ✅ **Filtering**: Filter by pending, completed, or all
- ✅ **Search**: Search action items by task text, description, or assignee
- ✅ **Date Handling**: Proper date conversion and invalid date handling
- ✅ **Full Workflow**: Complete end-to-end workflow test

## Troubleshooting

### Permission Denied Errors

If you see `PERMISSION_DENIED: No matching allow statements`:

1. Make sure the Firestore emulator has the latest rules:
   - Check that `firestore.rules` includes the `actionItems` collection rules
   - Restart the Firestore emulator to reload rules

2. Verify the test user is authenticated and participates in the test thread

3. Check that the test thread exists in Firestore before creating action items

### TypeScript Errors

If you see TypeScript compilation errors:

- Make sure all dependencies are installed: `npm install`
- Check that the types in `src/types/AIFeatures.ts` match the test expectations
