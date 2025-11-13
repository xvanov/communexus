// checklist_nlp_integration.test.ts - Integration tests for Checklist NLP Service
import {
  checklistNLPService,
  CommandPreview,
} from '../../src/services/checklistNLPService';
import { ChecklistItem } from '../../src/types/Checklist';
import { getChecklist, createChecklist, markItemComplete, createChecklistItem } from '../../src/services/checklistService';

/**
 * Integration tests for Checklist NLP Service
 * Tests service-to-service communication and real data flow
 * 
 * Note: These tests require Firebase emulator
 * Run with: npm test:emul -- tests/integration/checklist_nlp_integration.test.ts
 */
describe('Checklist NLP Service Integration', () => {
  let testChecklistId: string;
  let testThreadId: string;
  const testUserId = 'test-user-integration';

  beforeAll(async () => {
    // Create a test checklist in Firestore emulator
    testThreadId = `thread-${Date.now()}`;
    const checklist = await createChecklist({
      threadId: testThreadId,
      title: 'Integration Test Checklist',
      items: [
        {
          checklistId: '', // Will be set after creation
          title: 'Install bathroom tiles',
          status: 'pending',
          order: 0,
        },
        {
          checklistId: '',
          title: 'Paint kitchen walls',
          status: 'pending',
          order: 1,
        },
        {
          checklistId: '',
          title: 'Install cabinets',
          status: 'completed',
          order: 2,
        },
      ],
      createdBy: testUserId,
    });
    testChecklistId = checklist.id;
  });

  describe('Service-to-Service Integration', () => {
    it('should integrate with checklistService for mark_complete operations', async () => {
      // Given: A checklist exists with items
      // When: NLP service processes mark_complete command
      // Then: It correctly calls checklistService.markItemComplete()

      const checklist = await getChecklist(testChecklistId);
      expect(checklist).toBeDefined();
      expect(checklist?.items.length).toBeGreaterThan(0);

      // Process command via NLP service
      const preview = await checklistNLPService.processChecklistCommand(
        'mark item 1 complete',
        testChecklistId,
        checklist!.items
      );

      // Verify preview structure
      expect(preview.intent).toBe('mark_complete');
      expect(preview.matchedItem).toBeDefined();
      expect(preview.confidence).toBeGreaterThan(0.5);

      // Execute command
      if (preview.matchedItem) {
        const result = await checklistNLPService.executeCommand(
          preview,
          testChecklistId,
          testUserId
        );

        expect(result.success).toBe(true);
        expect(result.item).toBeDefined();

        // Verify item was actually marked complete in Firestore
        const updatedChecklist = await getChecklist(testChecklistId);
        const updatedItem = updatedChecklist?.items.find(item => item.id === preview.matchedItem!.id);
        expect(updatedItem?.status).toBe('completed');
      }
    });

    it('should integrate with checklistService for create_item operations', async () => {
      // Given: A checklist exists
      // When: NLP service processes create_item command
      // Then: It correctly calls checklistService.createChecklistItem()

      const checklist = await getChecklist(testChecklistId);
      const initialItemCount = checklist?.items.length || 0;

      // Process command via NLP service
      const preview = await checklistNLPService.processChecklistCommand(
        'add new task: install countertops',
        testChecklistId,
        checklist!.items
      );

      // Verify preview structure
      expect(preview.intent).toBe('create_item');
      expect(preview.newItemTitle).toBe('install countertops');
      expect(preview.confidence).toBeGreaterThan(0.5);

      // Execute command
      const result = await checklistNLPService.executeCommand(
        preview,
        testChecklistId,
        testUserId
      );

      expect(result.success).toBe(true);
      expect(result.item).toBeDefined();
      expect(result.item?.title).toBe('install countertops');

      // Verify item was actually created in Firestore
      const updatedChecklist = await getChecklist(testChecklistId);
      expect(updatedChecklist?.items.length).toBe(initialItemCount + 1);
      const newItem = updatedChecklist?.items.find(item => item.title === 'install countertops');
      expect(newItem).toBeDefined();
    });

    it('should work with checklists created in Story 0.1', async () => {
      // Given: A checklist created using Story 0.1 patterns
      // When: NLP service processes commands
      // Then: It works correctly with the checklist structure

      const checklist = await getChecklist(testChecklistId);
      expect(checklist).toBeDefined();

      // Verify item structure matches what NLP service expects
      const itemsForNLP = checklist!.items.map(item => ({
        id: item.id,
        title: item.title,
        status: item.status,
        order: item.order,
      }));

      expect(itemsForNLP.length).toBeGreaterThan(0);
      expect(itemsForNLP[0].id).toBeDefined();
      expect(itemsForNLP[0].title).toBeDefined();
      expect(itemsForNLP[0].status).toBeDefined();
      expect(itemsForNLP[0].order).toBeDefined();

      // Test that NLP service can process these items
      const preview = await checklistNLPService.processChecklistCommand(
        "what's next?",
        testChecklistId,
        itemsForNLP
      );

      expect(preview.intent).toBe('query_status');
      expect(preview.queryResult).toBeDefined();
    });
  });

  describe('Command Processing Flow with Real Services', () => {
    it('should handle full command processing flow with real Cloud Functions', async () => {
      // Given: A checklist with items
      // When: Processing commands through real Cloud Functions
      // Then: Commands are processed correctly

      const checklist = await getChecklist(testChecklistId);
      const testCommands = [
        { text: 'mark item 2 complete', expectedIntent: 'mark_complete' },
        { text: 'add new task: test integration', expectedIntent: 'create_item' },
        { text: "what's next?", expectedIntent: 'query_status' },
      ];

      for (const cmd of testCommands) {
        const preview = await checklistNLPService.processChecklistCommand(
          cmd.text,
          testChecklistId,
          checklist!.items
        );

        expect(preview.intent).toBe(cmd.expectedIntent);
        expect(preview.confidence).toBeGreaterThan(0.5);
      }
    });

    it('should handle item matching with real checklist data', async () => {
      // Given: A checklist with items
      // When: Matching items using semantic similarity
      // Then: Correct items are matched

      const checklist = await getChecklist(testChecklistId);
      
      // Test exact match
      const exactMatch = await checklistNLPService.matchChecklistItem(
        'Install bathroom tiles',
        testChecklistId,
        checklist!.items
      );
      expect(exactMatch).toBeDefined();
      expect(exactMatch?.title).toContain('bathroom tiles');

      // Test semantic match
      const semanticMatch = await checklistNLPService.matchChecklistItem(
        'tile installation',
        testChecklistId,
        checklist!.items
      );
      // Should match bathroom tiles semantically
      expect(semanticMatch).toBeDefined();
    });
  });
});

