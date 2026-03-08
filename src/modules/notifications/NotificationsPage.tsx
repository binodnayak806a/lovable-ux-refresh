import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Filter, AlertCircle, Calendar, FileText, Pill, BedDouble, Info, CheckCircle } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store';
import { usePageTitle } from '../../hooks/usePageTitle';
import PageHeader from '../../components/shared/PageHeader';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../../store/slices/notificationsSlice';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { NotificationType as AppNotificationType, NotificationSource } from '../../types/notification.types';

type IconKey = AppNotificationType | NotificationSource;

const NOTIFICATION_ICONS: Record<IconKey, React.ElementType> = {
  info: Info,
  warning: AlertCircle,
  error: AlertCircle,
  success: CheckCircle,
  system: Bell,
  appointment: Calendar,
  lab: FileText,
  pharmacy: Pill,
  billing: FileText,
  emergency: AlertCircle,
  ipd: BedDouble,
};

const NOTIFICATION_COLORS: Record<IconKey, { bg: string; text: string }> = {
  info: { bg: 'bg-blue-100', text: 'text-blue-600' },
  warning: { bg: 'bg-orange-100', text: 'text-orange-600' },
  error: { bg: 'bg-red-100', text: 'text-red-600' },
  success: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  system: { bg: 'bg-gray-100', text: 'text-gray-600' },
  appointment: { bg: 'bg-blue-100', text: 'text-blue-600' },
  lab: { bg: 'bg-teal-100', text: 'text-teal-600' },
  pharmacy: { bg: 'bg-amber-100', text: 'text-amber-600' },
  billing: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
  emergency: { bg: 'bg-red-100', text: 'text-red-600' },
  ipd: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
};

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    source?: string;
    is_read: boolean;
    created_at: string;
  };
  onMarkRead: (id: string) => void;
}) {
  const iconKey = (notification.source || notification.type || 'system') as IconKey;
  const Icon = NOTIFICATION_ICONS[iconKey] || Bell;
  const colors = NOTIFICATION_COLORS[iconKey] || NOTIFICATION_COLORS.system;
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer',
        !notification.is_read && 'bg-blue-50/50'
      )}
      onClick={() => !notification.is_read && onMarkRead(notification.id)}
    >
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', colors.bg)}>
        <Icon className={cn('w-5 h-5', colors.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={cn('text-sm font-medium', notification.is_read ? 'text-gray-700' : 'text-gray-900')}>
              {notification.title}
            </p>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
          </div>
          {!notification.is_read && (
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">{timeAgo}</p>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  usePageTitle('Notifications');
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items, unreadCount, status } = useAppSelector((state) => state.notifications);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchNotifications(user.id));
    }
  }, [dispatch, user?.id]);

  const handleMarkRead = (id: string) => {
    dispatch(markNotificationRead(id));
  };

  const handleMarkAllRead = () => {
    if (user?.id) {
      dispatch(markAllNotificationsRead(user.id));
    }
  };

  const filteredNotifications = items.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.is_read;
    if (activeTab === 'appointment') return n.source === 'appointment';
    if (activeTab === 'alert') return n.type === 'error' || n.type === 'warning';
    return n.source === activeTab || n.type === activeTab;
  });

  const loading = status === 'loading';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
        icon={Bell}
        actions={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
                <p className="text-sm text-gray-500">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{items.length - unreadCount}</p>
                <p className="text-sm text-gray-500">Read</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {items.filter((n) => n.type === 'error' || n.type === 'warning').length}
                </p>
                <p className="text-sm text-gray-500">Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">All Notifications</CardTitle>
            <Button variant="ghost" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-4 border-b border-gray-100">
              <TabsList className="h-10 bg-transparent p-0 gap-4">
                <TabsTrigger
                  value="all"
                  className="px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
                >
                  Unread
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="appointment"
                  className="px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent hidden sm:flex"
                >
                  Appointments
                </TabsTrigger>
                <TabsTrigger
                  value="alert"
                  className="px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent hidden sm:flex"
                >
                  Alerts
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="m-0">
              {loading ? (
                <div className="divide-y divide-gray-100">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-4 p-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-900 font-medium">No notifications</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {activeTab === 'unread' ? 'All notifications have been read' : 'You have no notifications yet'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={handleMarkRead}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
