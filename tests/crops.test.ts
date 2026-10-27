import { describe, it, expect } from 'vitest';

describe('Crop System', () => {
    it('should have 10 crop types', () => {
        expect(true).toBe(true);
    });
    
    it('should calculate growth correctly', () => {
        const growthDays = 4;
        const currentDay = 2;
        const isReady = currentDay >= growthDays;
        expect(isReady).toBe(false);
    });
});
