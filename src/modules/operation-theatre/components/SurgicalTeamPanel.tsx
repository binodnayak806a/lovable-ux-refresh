import { Plus, Trash2, UserCog } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { TeamMember, TeamRole } from '../types';
import { TEAM_ROLE_LABELS } from '../types';

const ROLE_COLORS: Record<TeamRole, string> = {
  lead_surgeon: 'bg-primary/10 text-primary border-primary/30',
  assistant_surgeon: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  anesthesiologist: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
  scrub_nurse: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
  circulating_nurse: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700',
};

interface Props {
  team: TeamMember[];
  onChange: (team: TeamMember[]) => void;
  readOnly?: boolean;
}

export default function SurgicalTeamPanel({ team, onChange, readOnly }: Props) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<TeamRole>('lead_surgeon');

  const addMember = () => {
    if (!name.trim()) return;
    onChange([...team, { id: crypto.randomUUID(), name: name.trim(), role }]);
    setName('');
  };

  const removeMember = (id: string) => onChange(team.filter((m) => m.id !== id));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <UserCog className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold text-foreground">Surgical Team</h4>
        <Badge variant="secondary" className="ml-auto text-xs">{team.length} members</Badge>
      </div>

      {/* Team list */}
      <div className="space-y-2">
        {team.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No team members assigned yet.</p>
        )}
        {team.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 bg-card"
          >
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground">
              {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{m.name}</div>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[m.role]}`}>
                {TEAM_ROLE_LABELS[m.role]}
              </Badge>
            </div>
            {!readOnly && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeMember(m.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add member */}
      {!readOnly && (
        <div className="flex gap-2">
          <Input
            placeholder="Staff name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMember()}
            className="flex-1"
          />
          <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(TEAM_ROLE_LABELS) as [TeamRole, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="icon" onClick={addMember} disabled={!name.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
