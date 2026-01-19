// Employee utilisé dans les équipes
export interface Employee {
  id: string;
  full_name: string;
  employee_type: string;
}

// Ce que Supabase renvoie pour une équipe
export interface TeamRaw {
  id: string;
  name: string;
  leader_id?: string | null;
  supervisor?: Employee[]; // relation leader_id
  sector?: string;
  status?: string;
  members?: Employee[]; // relation employees!team_id
  production_target?: number;
  efficiency_rate?: number;
}

// Interface finale que l'on utilisera dans le front
export interface Team {
  id: string;
  name: string;
  leader_id?: string | null;
  supervisor: Employee[];
  sector?: string;
  status?: string;
  members: Employee[];
  production_target?: number;
  efficiency_rate?: number;
}
