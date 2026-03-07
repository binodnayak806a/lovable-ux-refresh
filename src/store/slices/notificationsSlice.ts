import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import type { AppNotification, LoadingState } from '../../types';

interface NotificationsState {
  items: AppNotification[];
  unreadCount: number;
  status: LoadingState;
  error: string | null;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  status: 'idle',
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (userId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as AppNotification[];
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch notifications');
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true } as never)
        .eq('id', notificationId);
      if (error) throw error;
      return notificationId;
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to mark notification as read');
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (userId: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true } as never)
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    pushNotification(state, action: PayloadAction<AppNotification>) {
      state.items.unshift(action.payload);
      if (!action.payload.is_read) state.unreadCount += 1;
    },
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload;
    },
    resetNotifications: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.is_read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const item = state.items.find((n) => n.id === action.payload);
        if (item && !item.is_read) {
          item.is_read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((n) => { n.is_read = true; });
        state.unreadCount = 0;
      });
  },
});

export const { pushNotification, setUnreadCount, resetNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;
