class MapDiff {
  constructor(oldData, newData) {
    this.oldData = oldData || {};
    this.newData = newData || {};
  }

  affectedKeys() {
    const keys = new Set();
    for (const key in this.newData) {
      if (JSON.stringify(this.newData[key]) !== JSON.stringify(this.oldData[key])) {
        keys.add(key);
      }
    }
    // Check for removed keys (if any)
    for (const key in this.oldData) {
      if (!(key in this.newData)) {
        keys.add(key);
      }
    }

    return {
      hasOnly: (allowedKeys) => {
        for (const key of keys) {
          if (!allowedKeys.includes(key)) return false;
        }
        return true;
      },
      debug: () => Array.from(keys),
    };
  }
}

function checkMessageUpdate(testCase) {
  const { actorId, oldData, newData } = testCase;

  const request = {
    auth: { uid: actorId },
    resource: { data: newData },
  };
  const resource = { data: oldData };

  // Proposed Rules Logic Mock

  function isMessageSenderUpdate() {
    const diff = new MapDiff(resource.data, request.resource.data);
    return (
      resource.data.senderId == request.auth.uid &&
      request.resource.data.senderId == request.auth.uid &&
      request.resource.data.receiverId == resource.data.receiverId &&
      diff.affectedKeys().hasOnly(['subject', 'content', 'attachments', 'archived', 'updatedAt'])
    );
  }

  function isMessageReceiverUpdate() {
    const diff = new MapDiff(resource.data, request.resource.data);
    return (
      resource.data.receiverId == request.auth.uid &&
      request.resource.data.senderId == resource.data.senderId &&
      request.resource.data.receiverId == request.auth.uid &&
      diff.affectedKeys().hasOnly(['read', 'archived', 'updatedAt'])
    );
  }

  const allowed = request.auth != null && (isMessageSenderUpdate() || isMessageReceiverUpdate());

  return allowed;
}

console.log('🛡️  Verifying Proposed Message Rules...\n');

const cases = [
  {
    name: 'Sender updates content (Allowed)',
    actorId: 'sender1',
    oldData: { senderId: 'sender1', receiverId: 'recv1', content: 'Old', read: false },
    newData: { senderId: 'sender1', receiverId: 'recv1', content: 'New', read: false },
    expected: true,
  },
  {
    name: 'Sender changes senderId (Impersonation) (DENIED)',
    actorId: 'sender1',
    oldData: { senderId: 'sender1', receiverId: 'recv1', content: 'Old' },
    newData: { senderId: 'admin', receiverId: 'recv1', content: 'Old' },
    expected: false,
  },
  {
    name: 'Sender changes receiverId (Redirection) (DENIED)',
    actorId: 'sender1',
    oldData: { senderId: 'sender1', receiverId: 'recv1' },
    newData: { senderId: 'sender1', receiverId: 'victim' },
    expected: false,
  },
  {
    name: 'Receiver marks as read (Allowed)',
    actorId: 'recv1',
    oldData: { senderId: 'sender1', receiverId: 'recv1', read: false },
    newData: { senderId: 'sender1', receiverId: 'recv1', read: true },
    expected: true,
  },
  {
    name: 'Receiver changes content (DENIED)',
    actorId: 'recv1',
    oldData: { senderId: 'sender1', receiverId: 'recv1', content: 'Old' },
    newData: { senderId: 'sender1', receiverId: 'recv1', content: 'Hacked' },
    expected: false,
  },
  {
    name: 'Receiver changes senderId (Impersonation) (DENIED)',
    actorId: 'recv1',
    oldData: { senderId: 'sender1', receiverId: 'recv1' },
    newData: { senderId: 'recv1', receiverId: 'recv1' },
    expected: false,
  },
  {
    name: 'Random user tries to update (DENIED)',
    actorId: 'random',
    oldData: { senderId: 'sender1', receiverId: 'recv1' },
    newData: { senderId: 'sender1', receiverId: 'recv1', read: true },
    expected: false,
  },
  {
    name: 'Sender tries to mark as read (DENIED - strict)',
    actorId: 'sender1',
    oldData: { senderId: 'sender1', receiverId: 'recv1', read: false },
    newData: { senderId: 'sender1', receiverId: 'recv1', read: true },
    expected: false,
  },
];

let passed = 0;
let failed = 0;

cases.forEach((c) => {
  const allowed = checkMessageUpdate(c);
  if (allowed === c.expected) {
    passed++;
    console.log(`✅ ${c.name}: PASSED`);
  } else {
    failed++;
    console.error(`❌ ${c.name}: FAILED (Expected ${c.expected}, Got ${allowed})`);
  }
});

console.log(`\nSummary: ${passed}/${cases.length} Passed`);
if (failed > 0) process.exit(1);
