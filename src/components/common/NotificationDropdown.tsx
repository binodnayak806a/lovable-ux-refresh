import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, FlaskConical, Calendar, Package } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { supabase } from '../../lib/supabase';
import { useAppSelector } from '../../store';

interface Notification {
  id: string;
  type: 'lab' | 'appointment' | 'stock';
  title: string;
  description: string;
  link: string;
  count?: number;
}

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const hospitalId = user?.hospital_id ?? SAMPLE_HOSPITAL_ID;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [pendingLab, unconfirmedAppts, lowStock] = await Promise.all([
        supabase
          .from('lab_orders')
          .select('id', { count: 'exact', head: true })
          .eq('hospital_id', hospitalId)
          .in('status', ['pending', 'sample_collected']),
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('hospital_id', hospitalId)
          .eq('appointment_date', today)
          .eq('status', 'scheduled'),
        supabase
          .from('medicines_master')
          .select('id, stock_quantity, reorder_level', { count: 'exact' })
          .eq('hospital_id', hospitalId)
          .gt('reorder_level', 0)
          .then((res) => {
            if (res.data) {
              const lowStock = res.data.filter((m: any) =>
                (m.stock_quantity ?? 0) < (m.reorder_level ?? 0)
              );
              return { count: lowStock.length };
            }
            return { count: 0 };
          }),
      ]);

      const notifs: Notification[] = [];

      if ((pendingLab.count ?? 0) > 0) {
        notifs.push({
          id: 'lab',
          type: 'lab',
          title: 'Pending Lab Orders',
          description: `${pendingLab.count} lab orders awaiting results`,
          link: '/lab',
          count: pendingLab.count ?? 0,
        });
      }

      if ((unconfirmedAppts.count ?? 0) > 0) {
        notifs.push({
          id: 'appointments',
          type: 'appointment',
          title: "Today's Appointments",
          description: `${unconfirmedAppts.count} appointments scheduled for today`,
          link: '/appointments',
          count: unconfirmedAppts.count ?? 0,
        });
      }

      if ((lowStock.count ?? 0) > 0) {
        notifs.push({
          id: 'stock',
          type: 'stock',
          title: 'Low Stock Alert',
          description: `${lowStock.count} medicines below reorder level`,
          link: '/pharmacy',
          count: lowStock.count ?? 0,
        });
      }

      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [hospitalId]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const totalCount = notifications.reduce((sum, n) => sum + (n.count ?? 0), 0);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'lab':
        return <FlaskConical className="w-4 h-4" />;
      case 'appointment':
        return <Calendar className="w-4 h-4" />;
      case 'stock':
        return <Package className="w-4 h-4" />;
    }
  };

  const handleNotificationClick = (link: string) => {
    setOpen(false);
    navigate(link);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications, ${totalCount} unread`}
        >
          <Bell className="w-[18px] h-[18px]" />
          {totalCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {totalCount > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {totalCount}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No new notifications</p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex items-start gap-3 p-3 cursor-pointer"
                onClick={() => handleNotificationClick(notification.link)}
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    {notification.count && notification.count > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {notification.count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {notification.description}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-sm font-medium text-blue-600 cursor-pointer"
              onClick={() => {
                setOpen(false);
                navigate('/notifications');
              }}
            >
              View All Notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
