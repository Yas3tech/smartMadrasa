import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  generateHomeworkPath,
  generateProfilePicturePath,
  generateMessagePath,
  generateEventPath,
} from './storage';

describe('Storage Path Generators', () => {
  const MOCK_TIMESTAMP = 1715347200000; // 2024-05-10T13:20:00Z
  let dateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dateSpy = vi.spyOn(Date, 'now').mockReturnValue(MOCK_TIMESTAMP);
  });

  afterEach(() => {
    dateSpy.mockRestore();
  });

  describe('generateHomeworkPath', () => {
    it('should generate a correct path for homework submissions', () => {
      const homeworkId = 'hw123';
      const studentId = 'student456';
      const fileName = 'assignment.pdf';

      const path = generateHomeworkPath(homeworkId, studentId, fileName);

      expect(path).toBe(`homework/${homeworkId}/${studentId}/${MOCK_TIMESTAMP}_${fileName}`);
    });

    it('should sanitize the filename by replacing special characters with underscores', () => {
      const homeworkId = 'hw123';
      const studentId = 'student456';
      const fileName = 'my homework#1 (final).pdf';
      const expectedSanitizedName = 'my_homework_1__final_.pdf';

      const path = generateHomeworkPath(homeworkId, studentId, fileName);

      expect(path).toBe(
        `homework/${homeworkId}/${studentId}/${MOCK_TIMESTAMP}_${expectedSanitizedName}`
      );
    });

    it('should preserve dots and dashes in the filename', () => {
      const fileName = 'my-assignment.v1.test.pdf';
      const path = generateHomeworkPath('id', 'std', fileName);
      expect(path).toContain(fileName);
    });
  });

  describe('generateProfilePicturePath', () => {
    it('should generate a correct path for profile pictures', () => {
      const userId = 'user789';
      const fileName = 'avatar.png';

      const path = generateProfilePicturePath(userId, fileName);

      expect(path).toBe(`profiles/${userId}/${fileName}`);
    });

    it('should sanitize the filename', () => {
      const userId = 'user789';
      const fileName = 'my photo!.jpg';
      const expectedSanitizedName = 'my_photo_.jpg';

      const path = generateProfilePicturePath(userId, fileName);

      expect(path).toBe(`profiles/${userId}/${expectedSanitizedName}`);
    });
  });

  describe('generateMessagePath', () => {
    it('should generate a correct path for message attachments', () => {
      const senderId = 'sender123';
      const fileName = 'image.jpg';

      const path = generateMessagePath(senderId, fileName);

      expect(path).toBe(`messages/${senderId}/${MOCK_TIMESTAMP}_${fileName}`);
    });

    it('should sanitize the filename', () => {
      const fileName = 'document with spaces.docx';
      const expectedSanitizedName = 'document_with_spaces.docx';
      const path = generateMessagePath('sender', fileName);
      expect(path).toContain(expectedSanitizedName);
    });
  });

  describe('generateEventPath', () => {
    it('should generate a correct path for event attachments', () => {
      const eventId = 'event456';
      const fileName = 'poster.png';

      const path = generateEventPath(eventId, fileName);

      expect(path).toBe(`events/${eventId}/${MOCK_TIMESTAMP}_${fileName}`);
    });

    it('should handle "new" event ID', () => {
      const fileName = 'new_event_info.pdf';
      const path = generateEventPath('new', fileName);
      expect(path).toBe(`events/new/${MOCK_TIMESTAMP}_${fileName}`);
    });

    it('should sanitize the filename', () => {
      const fileName = 'event-poster & info.png';
      const expectedSanitizedName = 'event-poster___info.png';
      const path = generateEventPath('event', fileName);
      expect(path).toContain(expectedSanitizedName);
    });
  });
});
