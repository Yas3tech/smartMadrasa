import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Messages from './Messages';
import { useMessages } from '../../hooks/useMessages';
import type { Message } from '../../types';

// Mock the hook
vi.mock('../../hooks/useMessages');

// Mock UI components
vi.mock('../../components/UI', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  Modal: ({ children, isOpen }: any) => (isOpen ? <div>{children}</div> : null),
  Input: ({ label, value, onChange }: any) => (
    <input aria-label={label} value={value} onChange={onChange} />
  ),
}));

// Mock Translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Search: () => <span>Search</span>,
  PenSquare: () => <span>Compose</span>,
  Inbox: () => <span>Inbox</span>,
  Send: () => <span>Sent</span>,
  Archive: () => <span>Archive</span>,
  Trash2: () => <span>Delete</span>,
  Reply: () => <span>Reply</span>,
  Forward: () => <span>Forward</span>,
  Filter: () => <span>Filter</span>,
  X: () => <span>Close</span>,
  Paperclip: () => <span>Attachment</span>,
  File: () => <span>File</span>,
  ChevronLeft: () => <span>Back</span>,
}));

describe('Messages Component Security', () => {
  const mockMessage: Message = {
    id: 'msg1',
    senderId: 'user1',
    receiverId: 'user2',
    senderName: 'Attacker',
    senderRole: 'student',
    subject: 'Malicious Message',
    content: 'Click the attachment',
    timestamp: new Date().toISOString(),
    read: false,
    archived: false,
    type: 'individual',
    attachments: ['data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='], // Malicious attachment
  };

  beforeEach(() => {
    (useMessages as any).mockReturnValue({
      selectedFolder: 'inbox',
      setSelectedFolder: vi.fn(),
      filteredMessages: [mockMessage],
      selectedMessage: mockMessage, // Select the malicious message
      setSelectedMessage: vi.fn(),
      searchQuery: '',
      setSearchQuery: vi.fn(),
      isMobile: false,
      mobileView: 'detail',
      setMobileView: vi.fn(),
      isComposeOpen: false,
      setIsComposeOpen: vi.fn(),
      composeMode: 'new',
      recipient: '',
      setRecipient: vi.fn(),
      recipientSearch: '',
      setRecipientSearch: vi.fn(),
      showRecipientDropdown: false,
      setShowRecipientDropdown: vi.fn(),
      subject: '',
      setSubject: vi.fn(),
      content: '',
      setContent: vi.fn(),
      attachments: [],
      setAttachments: vi.fn(),
      fileInputRef: { current: null },
      filteredRecipients: [],
      selectedRecipientLabel: '',
      handleArchiveMessage: vi.fn(),
      handleComposeNew: vi.fn(),
      handleReply: vi.fn(),
      handleForward: vi.fn(),
      handleFileSelect: vi.fn(),
      removeAttachment: vi.fn(),
      handleSendMessage: vi.fn(),
      handleSelectMessage: vi.fn(),
      handleDeleteMessage: vi.fn(),
    });
  });

  it('does NOT render malicious attachment link', () => {
    render(<Messages />);

    // Check if the link exists
    const links = screen.queryAllByRole('link');
    const attachmentLink = links.find((link) => link.getAttribute('href')?.startsWith('data:'));

    // If this assertion passes, it means the vulnerability is FIXED (link is NOT rendered)
    expect(attachmentLink).toBeUndefined();
  });
});
