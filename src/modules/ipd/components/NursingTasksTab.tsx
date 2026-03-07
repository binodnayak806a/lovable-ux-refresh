import { useState, useEffect, useMemo } from 'react';
import {
  Plus, CheckCircle, Clock, Activity, Pill,
  Eye, TestTube, Stethoscope, ClipboardList, Loader2,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import ipdService from '../../../services/ipd.service';
import AddTaskDialog from './AddTaskDialog';
import type { Admission, NursingTask, TaskType } from '../types';
import { PRIORITY_CONFIG } from '../types';
import { format, parseISO } from 'date-fns';

interface Props {
  admission: Admission;
  onUpdate: () => void;
}

const TASK_ICONS: Record<TaskType, React.ElementType> = {
  Vitals: Activity,
  Medication: Pill,
  Observation: Eye,
  Dressing: ClipboardList,
  Lab: TestTube,
  Procedure: Stethoscope,
  Other: ClipboardList,
};

export default function NursingTasksTab({ admission, onUpdate }: Props) {
  const { user } = useAppSelector((s) => s.auth);
  const { toast } = useToast();

  const [tasks, setTasks] = useState<NursingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const loadTasks = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await ipdService.getNursingTasks(admission.id, today);
      setTasks(data);
    } catch {
      toast('Error', { description: 'Failed to load tasks', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [admission.id]);

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTaskId(taskId);
    try {
      await ipdService.updateTaskStatus(taskId, 'completed', user?.id ?? '');
      loadTasks();
      onUpdate();
      toast('Task Completed', { type: 'success' });
    } catch {
      toast('Error', { description: 'Failed to complete task', type: 'error' });
    } finally {
      setCompletingTaskId(null);
    }
  };

  const groupedTasks = useMemo(() => {
    const groups: Record<string, NursingTask[]> = {};
    tasks.forEach((task) => {
      const hour = format(parseISO(task.scheduled_time), 'HH:00');
      if (!groups[hour]) groups[hour] = [];
      groups[hour].push(task);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [tasks]);

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-700">Today's Tasks</h4>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span>{pendingCount} pending</span>
            <span>{completedCount} completed</span>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setShowAddTask(true)}
          className="gap-1.5 h-7 text-xs bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          No tasks scheduled for today
        </div>
      ) : (
        <div className="space-y-4">
          {groupedTasks.map(([hour, hourTasks]) => (
            <div key={hour}>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {hour}
              </div>
              <div className="space-y-2">
                {hourTasks.map((task) => {
                  const Icon = TASK_ICONS[task.task_type];
                  const priorityConfig = PRIORITY_CONFIG[task.priority];
                  const isCompleted = task.status === 'completed';
                  const isUrgent = task.priority === 'urgent';

                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isCompleted
                          ? 'bg-gray-50 border-gray-100 opacity-60'
                          : isUrgent
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isCompleted ? 'bg-gray-200' : priorityConfig.bgColor
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isCompleted ? 'text-gray-500' : priorityConfig.color}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'
                              }`}
                            >
                              {task.task_description}
                            </span>
                            {isUrgent && !isCompleted && (
                              <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5">
                                URGENT
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{format(parseISO(task.scheduled_time), 'HH:mm')}</span>
                            <span className="text-gray-300">|</span>
                            <span className="capitalize">{task.task_type}</span>
                          </div>

                          {task.notes && (
                            <div className="mt-1.5 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                              {task.notes}
                            </div>
                          )}
                        </div>

                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleCompleteTask(task.id)}
                            disabled={completingTaskId === task.id}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                          >
                            {completingTaskId === task.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {isCompleted && (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddTask && (
        <AddTaskDialog
          admission={admission}
          onClose={() => setShowAddTask(false)}
          onSuccess={() => {
            setShowAddTask(false);
            loadTasks();
            onUpdate();
          }}
        />
      )}
    </div>
  );
}
