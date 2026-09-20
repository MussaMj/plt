import type { LucideIcon } from 'lucide-react';
import {
    AlertTriangle,
    Ban,
    Construction,
    Droplets,
    Footprints,
    HelpCircle,
    Lightbulb,
    Signpost,
    TrafficCone,
} from 'lucide-react';

/** Mirrors myApp/src/screens/report/categories.ts — keep labels in sync with the mobile app. */
export const CATEGORY_LABELS: Record<string, { label: string; icon: LucideIcon }> = {
    pothole: { label: 'Buraco', icon: AlertTriangle },
    pavement: { label: 'Pavimento danificado', icon: Construction },
    traffic_light: { label: 'Semáforo', icon: TrafficCone },
    signage: { label: 'Sinalização', icon: Signpost },
    drainage: { label: 'Drenagem/Alagamento', icon: Droplets },
    sidewalk: { label: 'Passeio', icon: Footprints },
    obstruction: { label: 'Obstrução', icon: Ban },
    lighting: { label: 'Iluminação', icon: Lightbulb },
    other: { label: 'Outro', icon: HelpCircle },
};

export function getCategoryLabel(category?: string | null): string {
    if (!category) return 'Sem categoria';
    return CATEGORY_LABELS[category]?.label ?? category;
}

export function getCategoryIcon(category?: string | null): LucideIcon {
    return (category && CATEGORY_LABELS[category]?.icon) || HelpCircle;
}
