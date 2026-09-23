/** Approximate centre + zoom used to open the map on a manager's own province. */
export const PROVINCE_VIEWS: Record<string, { center: [number, number]; zoom: number }> = {
    'Cabo Delgado': { center: [-12.97, 39.5], zoom: 8 },
    'Gaza': { center: [-23.3, 32.9], zoom: 8 },
    'Inhambane': { center: [-22.8, 34.6], zoom: 8 },
    'Manica': { center: [-18.9, 33.0], zoom: 8 },
    'Maputo Cidade': { center: [-25.9692, 32.5732], zoom: 12 },
    'Maputo Província': { center: [-25.6, 32.5], zoom: 9 },
    'Nampula': { center: [-14.5, 39.3], zoom: 8 },
    'Niassa': { center: [-13.3, 36.3], zoom: 7 },
    'Sofala': { center: [-19.0, 34.5], zoom: 8 },
    'Tete': { center: [-15.5, 32.6], zoom: 8 },
    'Zambézia': { center: [-16.5, 37.0], zoom: 8 },
};

export const NATIONAL_VIEW: { center: [number, number]; zoom: number } = { center: [-18.7, 35.5], zoom: 5 };

export function getMapView(province: string | null) {
    return (province && PROVINCE_VIEWS[province]) || NATIONAL_VIEW;
}

/**
 * PostgREST `or` filter matching a manager's province *and* reports whose
 * province could not be detected (null) — otherwise those reports would be
 * invisible to every provincial manager. Values are double-quoted because
 * province names contain spaces/accents.
 */
export function provinceOrFilter(province: string): string {
    const safe = province.replace(/"/g, '');
    return `province.eq."${safe}",province.is.null`;
}
