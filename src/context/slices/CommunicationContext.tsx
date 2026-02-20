import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from '../AuthContext';
import type { Message, Event, Parent, Student, Teacher } from '../../types';
import { isFirebaseConfigured } from '../../config/firebase';
import {
  subscribeToMessages,
  sendMessage as fbSendMessage,
  deleteMessage as fbDeleteMessage,
  markMessageAsRead as fbMarkMessageAsRead,
  updateMessage as fbUpdateMessage,
} from '../../services/messages';
import {
  subscribeToEvents,
  subscribeToEventsByClassIds,
  createEvent as fbCreateEvent,
  updateEvent as fbUpdateEvent,
  deleteEvent as fbDeleteEvent,
} from '../../services/events';

export interface CommunicationContextType {
  messages: Message[];
  events: Event[];
  isLoading: boolean;

  sendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  deleteMessage: (id: string | number) => Promise<void>;
  markMessageAsRead: (id: string | number) => Promise<void>;
  updateMessage: (id: string | number, updates: Partial<Message>) => Promise<void>;

  addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

const CommunicationContext = createContext<CommunicationContextType | undefined>(undefined);

export const CommunicationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const useFirebase = isFirebaseConfigured;
  const [isLoading, setIsLoading] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (useFirebase) {
      const unsubMessages = subscribeToMessages(setMessages, user?.id);
      let unsubEvents = () => {};

      if (user?.role === 'parent') {
        const parentUser = user as Parent;
        const childrenData = parentUser.children || [];
        const classIds = childrenData.map((c) => c.classId).filter(Boolean);

        if (classIds.length > 0) {
          unsubEvents = subscribeToEventsByClassIds(classIds, setEvents);
        }
      } else if (user?.role === 'student') {
        const student = user as Student;
        unsubEvents = student.classId ? subscribeToEvents(setEvents, [student.classId]) : () => {};
      } else if (user?.role === 'teacher') {
        const teacher = user as Teacher;
        unsubEvents =
          teacher.classIds?.length > 0 ? subscribeToEvents(setEvents, teacher.classIds) : () => {};
      } else {
        // Director / Admin
        unsubEvents = subscribeToEvents(setEvents);
      }

      setIsLoading(false);

      return () => {
        unsubMessages();
        unsubEvents();
      };
    } else {
      setIsLoading(false);
    }
  }, [useFirebase, user]);

  const sendMessage = useCallback(
    async (message: Omit<Message, 'id' | 'timestamp'>) => {
      if (useFirebase) {
        await fbSendMessage(message);
      }
    },
    [useFirebase]
  );

  const deleteMessage = useCallback(
    async (id: string | number) => {
      if (useFirebase) {
        await fbDeleteMessage(String(id));
      }
    },
    [useFirebase]
  );

  const markMessageAsRead = useCallback(
    async (id: string | number) => {
      if (useFirebase) {
        await fbMarkMessageAsRead(String(id));
      }
    },
    [useFirebase]
  );

  const updateMessage = useCallback(
    async (id: string | number, updates: Partial<Message>) => {
      if (useFirebase) {
        await fbUpdateMessage(String(id), updates);
      }
    },
    [useFirebase]
  );

  const addEvent = useCallback(
    async (event: Omit<Event, 'id'>) => {
      if (useFirebase) {
        await fbCreateEvent(event);
      }
    },
    [useFirebase]
  );

  const updateEvent = useCallback(
    async (id: string, updates: Partial<Event>) => {
      if (useFirebase) {
        await fbUpdateEvent(id, updates);
      }
    },
    [useFirebase]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      if (useFirebase) {
        await fbDeleteEvent(id);
      }
    },
    [useFirebase]
  );

  const value = useMemo(
    () => ({
      messages,
      events,
      isLoading,
      sendMessage,
      deleteMessage,
      markMessageAsRead,
      updateMessage,
      addEvent,
      updateEvent,
      deleteEvent,
    }),
    [
      messages,
      events,
      isLoading,
      sendMessage,
      deleteMessage,
      markMessageAsRead,
      updateMessage,
      addEvent,
      updateEvent,
      deleteEvent,
    ]
  );

  return <CommunicationContext.Provider value={value}>{children}</CommunicationContext.Provider>;
};

export const useCommunication = () => {
  const context = useContext(CommunicationContext);
  if (!context) {
    throw new Error('useCommunication must be used within CommunicationProvider');
  }
  return context;
};
