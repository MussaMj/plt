import { describe, expect, it } from 'vitest';
import { ReportRow, mapReportRow, mapTechnicianRow } from './types';
import { getCategoryLabel } from './categories';

const row: ReportRow = {
    id: 'r1', latitude: -25.9, longitude: 32.5, address: 'Av. X', province: 'Maputo Cidade', city: 'Maputo',
    category: 'drainage', description: null, image_url: null, size: null, impact: null, risk: null, tags: null,
    severity: 'high', status: 'reported', report_count: 3, reporter_uids: ['a', 'b'],
    assigned_technician: null, assigned_technician_id: null, repair_image_url: null,
    created_at: '2026-09-01T10:00:00Z', updated_at: null,
};

describe('mapReportRow', () => {
    it('maps snake_case columns and applies safe defaults', () => {
        const p = mapReportRow(row);
        expect(p.location).toEqual({ latitude: -25.9, longitude: 32.5 });
        expect(p.description).toBe('');
        expect(p.imageUrl).toBe('');
        expect(p.reportCount).toBe(3);
        expect(p.createdAt).toBeInstanceOf(Date);
        expect(p.updatedAt).toBeUndefined();
    });

    it('carries the technician assignment and repair photo through', () => {
        const p = mapReportRow({ ...row, assigned_technician_id: 't1', assigned_technician: 'Ana', repair_image_url: 'http://x/y.jpg' });
        expect(p.assignedTechnicianId).toBe('t1');
        expect(p.assignedTechnician).toBe('Ana');
        expect(p.repairImageUrl).toBe('http://x/y.jpg');
    });
});

describe('mapTechnicianRow', () => {
    it('maps a technician row', () => {
        expect(mapTechnicianRow({ id: 't', name: 'Ana', email: 'a@x', province: 'Gaza', active: false }))
            .toEqual({ id: 't', name: 'Ana', email: 'a@x', province: 'Gaza', active: false });
    });
});

describe('getCategoryLabel', () => {
    it('labels every mobile category and handles missing/unknown ones', () => {
        expect(getCategoryLabel('drainage')).toBe('Drenagem/Alagamento');
        expect(getCategoryLabel(null)).toBe('Sem categoria');
        expect(getCategoryLabel('something_new')).toBe('something_new');
    });
});
