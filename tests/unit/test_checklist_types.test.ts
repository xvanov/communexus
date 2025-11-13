import {
  Checklist,
  ChecklistItem,
  ChecklistItemStatus,
} from '../../src/types/Checklist';

describe('Checklist Data Model', () => {
  describe('ChecklistItem interface', () => {
    it('should have all required fields', () => {
      const item: ChecklistItem = {
        id: 'item-1',
        checklistId: 'checklist-1',
        title: 'Test item',
        status: 'pending',
        order: 0,
      };

      expect(item.id).toBe('item-1');
      expect(item.checklistId).toBe('checklist-1');
      expect(item.title).toBe('Test item');
      expect(item.status).toBe('pending');
      expect(item.order).toBe(0);
    });

    it('should support optional fields', () => {
      const item: ChecklistItem = {
        id: 'item-1',
        checklistId: 'checklist-1',
        title: 'Test item',
        status: 'completed',
        order: 0,
        completedAt: new Date(),
        completedBy: 'user-123',
        mediaAttachments: ['url1', 'url2'],
      };

      expect(item.completedAt).toBeInstanceOf(Date);
      expect(item.completedBy).toBe('user-123');
      expect(item.mediaAttachments).toEqual(['url1', 'url2']);
    });

    it('should accept valid status values', () => {
      const statuses: ChecklistItemStatus[] = ['pending', 'in-progress', 'completed'];
      
      statuses.forEach(status => {
        const item: ChecklistItem = {
          id: 'item-1',
          checklistId: 'checklist-1',
          title: 'Test item',
          status,
          order: 0,
        };
        expect(item.status).toBe(status);
      });
    });
  });

  describe('Checklist interface', () => {
    it('should have all required fields', () => {
      const checklist: Checklist = {
        id: 'checklist-1',
        threadId: 'thread-1',
        title: 'Test checklist',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-123',
      };

      expect(checklist.id).toBe('checklist-1');
      expect(checklist.threadId).toBe('thread-1');
      expect(checklist.title).toBe('Test checklist');
      expect(checklist.items).toEqual([]);
      expect(checklist.createdAt).toBeInstanceOf(Date);
      expect(checklist.updatedAt).toBeInstanceOf(Date);
      expect(checklist.createdBy).toBe('user-123');
    });

    it('should support optional progress field', () => {
      const checklist: Checklist = {
        id: 'checklist-1',
        threadId: 'thread-1',
        title: 'Test checklist',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-123',
        progress: {
          total: 10,
          completed: 5,
          percentage: 50,
        },
      };

      expect(checklist.progress).toBeDefined();
      expect(checklist.progress?.total).toBe(10);
      expect(checklist.progress?.completed).toBe(5);
      expect(checklist.progress?.percentage).toBe(50);
    });

    it('should contain ChecklistItem array', () => {
      const checklist: Checklist = {
        id: 'checklist-1',
        threadId: 'thread-1',
        title: 'Test checklist',
        items: [
          {
            id: 'item-1',
            checklistId: 'checklist-1',
            title: 'Item 1',
            status: 'pending',
            order: 0,
          },
          {
            id: 'item-2',
            checklistId: 'checklist-1',
            title: 'Item 2',
            status: 'completed',
            order: 1,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-123',
      };

      expect(checklist.items).toHaveLength(2);
      expect(checklist.items[0].title).toBe('Item 1');
      expect(checklist.items[1].status).toBe('completed');
    });
  });
});

