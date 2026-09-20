export type PotholeStatus = 'reported' | 'in_repair' | 'repaired';
export type PotholeSeverity = 'low' | 'medium' | 'high';

export interface Pothole {
    id: string;
    address?: string;
    province?: string | null;
    city?: string | null;
    category?: string | null;
    description: string;
    status: PotholeStatus;
    severity: PotholeSeverity;
    reportCount: number;
    imageUrl: string;
    location: { latitude: number; longitude: number };
    assignedTechnician?: string;
    assignedTechnicianId?: string | null;
    repairImageUrl?: string | null;
    reporterUids?: string[];
    tags?: string[];
    size?: string;
    impact?: string;
    risk?: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface ReportRow {
    id: string;
    latitude: number;
    longitude: number;
    address: string | null;
    province: string | null;
    city: string | null;
    category: string | null;
    description: string | null;
    image_url: string | null;
    size: string | null;
    impact: string | null;
    risk: string | null;
    tags: string[] | null;
    severity: PotholeSeverity;
    status: PotholeStatus;
    report_count: number;
    reporter_uids: string[] | null;
    assigned_technician: string | null;
    assigned_technician_id: string | null;
    repair_image_url: string | null;
    created_at: string;
    updated_at: string | null;
}

export function mapReportRow(row: ReportRow): Pothole {
    return {
        id: row.id,
        address: row.address ?? undefined,
        province: row.province,
        city: row.city,
        category: row.category,
        description: row.description ?? '',
        status: row.status,
        severity: row.severity,
        reportCount: row.report_count,
        imageUrl: row.image_url ?? '',
        location: { latitude: row.latitude, longitude: row.longitude },
        assignedTechnician: row.assigned_technician ?? undefined,
        assignedTechnicianId: row.assigned_technician_id,
        repairImageUrl: row.repair_image_url,
        reporterUids: row.reporter_uids ?? undefined,
        tags: row.tags ?? undefined,
        size: row.size ?? undefined,
        impact: row.impact ?? undefined,
        risk: row.risk ?? undefined,
        createdAt: new Date(row.created_at),
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
}

export interface ReportNote {
    id: string;
    reportId: string;
    authorName: string | null;
    note: string;
    createdAt: Date;
}

export interface ReportNoteRow {
    id: string;
    report_id: string;
    author_name: string | null;
    note: string;
    created_at: string;
}

export function mapReportNoteRow(row: ReportNoteRow): ReportNote {
    return {
        id: row.id,
        reportId: row.report_id,
        authorName: row.author_name,
        note: row.note,
        createdAt: new Date(row.created_at),
    };
}

export interface ManagerProfile {
    id: string;
    role: string;
    province: string | null;
    name: string | null;
}

export interface Technician {
    id: string;
    name: string;
    email: string | null;
    province: string | null;
    active: boolean;
}

export interface TechnicianRow {
    id: string;
    name: string;
    email: string | null;
    province: string | null;
    active: boolean;
}

export function mapTechnicianRow(row: TechnicianRow): Technician {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        province: row.province,
        active: row.active,
    };
}

export const MAPUTO_CENTER: [number, number] = [-25.9692, 32.5732];
