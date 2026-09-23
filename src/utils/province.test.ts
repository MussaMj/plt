import { describe, expect, it } from 'vitest';
import { NATIONAL_VIEW, PROVINCE_VIEWS, getMapView, provinceOrFilter } from './province';

describe('provinceOrFilter', () => {
    it('matches the province and reports with an undetected (null) province', () => {
        expect(provinceOrFilter('Gaza')).toBe('province.eq."Gaza",province.is.null');
    });

    it('quotes names with spaces and accents', () => {
        expect(provinceOrFilter('Maputo Província')).toBe('province.eq."Maputo Província",province.is.null');
    });

    it('cannot be broken out of the quoting', () => {
        expect(provinceOrFilter('Gaza",province.is.null,x.eq."1')).not.toContain('"1"');
        expect(provinceOrFilter('a"b')).toBe('province.eq."ab",province.is.null');
    });
});

describe('getMapView', () => {
    it('opens on the manager province', () => {
        expect(getMapView('Sofala')).toBe(PROVINCE_VIEWS['Sofala']);
    });

    it('falls back to the national view for national managers or unknown provinces', () => {
        expect(getMapView(null)).toBe(NATIONAL_VIEW);
        expect(getMapView('Atlântida')).toBe(NATIONAL_VIEW);
    });

    it('has a view for every one of the 11 provinces', () => {
        expect(Object.keys(PROVINCE_VIEWS)).toHaveLength(11);
    });
});
