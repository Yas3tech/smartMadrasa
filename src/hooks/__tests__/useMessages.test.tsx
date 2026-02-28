import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMessages } from '../useMessages';
import { useAuth } from '../../context/AuthContext';
import { useData, useCommunication, useUsers, useAcademics } from '../../context/DataContext';

// Mock the modules
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../context/DataContext', () => ({
  useData: vi.fn(),
  useCommunication: vi.fn(),
  useUsers: vi.fn(),
  useAcademics: vi.fn(),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'fr' },
  }),
}));

describe('useMessages', () => {
  const mockUser = { id: 'user1', name: 'User 1', role: 'teacher' };

  const mockMessages = [
    {
      id: 'm1',
      senderId: 'user2',
      senderName: 'User 2',
      receiverId: 'user1',
      subject: 'Hello',
      content: 'World',
      read: false,
      archived: false,
      timestamp: new Date().toISOString(),
    },
    {
      id: 'm2',
      senderId: 'user1',
      senderName: 'User 1',
      receiverId: 'user2',
      subject: 'Reply',
      content: 'Hi there',
      read: true,
      archived: false,
      timestamp: new Date().toISOString(),
    },
    {
      id: 'm3',
      senderId: 'user3',
      senderName: 'User 3',
      receiverId: 'user1',
      subject: 'Old',
      content: 'Message',
      read: true,
      archived: true,
      timestamp: new Date().toISOString(),
    },
  ];

  const mockUsers = [
    { id: 'user1', name: 'User 1', role: 'teacher' },
    { id: 'user2', name: 'User 2', role: 'student' },
    { id: 'user3', name: 'User 3', role: 'parent' },
  ];

  const mockClasses = [{ id: 'c1', name: 'Class A', teacherId: 'user1' }];

  const mockSendMessage = vi.fn();
  const mockDeleteMessage = vi.fn();
  const mockMarkMessageAsRead = vi.fn();
  const mockUpdateMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({ user: mockUser as any } as ReturnType<typeof useAuth>);

    const communicationContext = {
      messages: mockMessages,
      sendMessage: mockSendMessage,
      deleteMessage: mockDeleteMessage,
      markMessageAsRead: mockMarkMessageAsRead,
      updateMessage: mockUpdateMessage,
    };

    const usersContext = {
      users: mockUsers,
    };

    const academicsContext = {
      classes: mockClasses,
    };

    // Mock useData for current implementation
    vi.mocked(useData).mockReturnValue({
      ...communicationContext,
      ...usersContext,
      ...academicsContext,
    } as any);

    // Mock granular hooks for future implementation
    vi.mocked(useCommunication).mockReturnValue(communicationContext as any);
    vi.mocked(useUsers).mockReturnValue(usersContext as any);
    vi.mocked(useAcademics).mockReturnValue(academicsContext as any);
  });

  it('should filter inbox messages correctly', () => {
    const { result } = renderHook(() => useMessages());

    expect(result.current.filteredMessages).toHaveLength(1);
    expect(result.current.filteredMessages[0].id).toBe('m1');
  });

  it('should filter sent messages correctly', () => {
    const { result } = renderHook(() => useMessages());

    act(() => {
      result.current.setSelectedFolder('sent');
    });

    expect(result.current.filteredMessages).toHaveLength(1);
    expect(result.current.filteredMessages[0].id).toBe('m2');
  });

  it('should filter archived messages correctly', () => {
    const { result } = renderHook(() => useMessages());

    act(() => {
      result.current.setSelectedFolder('archive');
    });

    expect(result.current.filteredMessages).toHaveLength(1);
    expect(result.current.filteredMessages[0].id).toBe('m3');
  });

  it('should search messages correctly', () => {
    const { result } = renderHook(() => useMessages());

    act(() => {
      result.current.setSearchQuery('World');
    });

    expect(result.current.filteredMessages).toHaveLength(1);
    expect(result.current.filteredMessages[0].content).toContain('World');
  });

  it('should handle selecting a message', () => {
    const { result } = renderHook(() => useMessages());

    act(() => {
      result.current.handleSelectMessage(mockMessages[0] as any);
    });

    expect(result.current.selectedMessage?.id).toBe('m1');
    // Should mark as read if inbox
    expect(mockMarkMessageAsRead).toHaveBeenCalledWith('m1');
  });

  it('should generate recipient list', () => {
    const { result } = renderHook(() => useMessages());

    // Check if recipients are generated
    // 1 All Users + 3 Users + 1 Class = 5
    expect(result.current.filteredRecipients.length).toBeGreaterThan(0);
    const userRecipient = result.current.filteredRecipients.find((r) => r.id === 'user2');
    expect(userRecipient).toBeDefined();
  });

  it('should send a message', () => {
    const { result } = renderHook(() => useMessages());

    act(() => {
      result.current.handleComposeNew();
    });

    act(() => {
      result.current.setRecipient('user2');
      result.current.setSubject('Test Subject');
      result.current.setContent('Test Content');
    });

    act(() => {
      result.current.handleSendMessage();
    });

    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        receiverId: 'user2',
        subject: 'Test Subject',
        content: 'Test Content',
      })
    );
  });
});
