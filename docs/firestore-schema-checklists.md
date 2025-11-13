# Firestore Schema: Checklists Collection

## Collection: `checklists`

The `checklists` collection stores checklist documents linked to threads. Checklists enable users to track project tasks in a structured way.

## Document Structure

```typescript
{
  id: string;                    // Document ID (auto-generated)
  threadId: string;              // Reference to thread document
  title: string;                 // Checklist title
  items: ChecklistItem[];        // Array of checklist items (embedded)
  createdAt: Timestamp;          // Creation timestamp
  updatedAt: Timestamp;          // Last update timestamp
  createdBy: string;             // User ID of creator
}
```

## ChecklistItem Structure (Embedded Array)

```typescript
{
  id: string;                    // Unique item ID
  checklistId: string;           // Reference to parent checklist
  title: string;                 // Item title
  status: 'pending' | 'in-progress' | 'completed';
  order: number;                 // Sort order within checklist
  completedAt?: Timestamp;       // Completion timestamp (optional)
  completedBy?: string;          // User ID who completed (optional)
  mediaAttachments?: string[];   // Array of media URLs (optional)
}
```

## Security Rules

Checklists follow thread-based access control:

- **Read**: Users can read checklists for threads they participate in
- **Create**: Users can create checklists for threads they participate in
- **Update**: Users can update checklists for threads they participate in
- **Delete**: Users can delete checklists for threads they participate in

Access is verified by checking if the user's ID is in the thread's `participants` array.

## Indexes

No composite indexes required for MVP. Queries use:
- `threadId` (equality) for filtering checklists by thread
- `createdAt` (descending) for sorting

## Notes

- Items are stored as an embedded array for MVP simplicity
- Future versions may move items to a subcollection for better scalability
- All timestamps use Firestore `Timestamp` type
- Thread participation is verified via security rules

