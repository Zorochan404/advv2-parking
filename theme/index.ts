import { colors } from './colors';

export const theme = {
    colors,
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
        xxl: 40,
    },
    borderRadius: {
        s: 4,
        m: 8,
        l: 12,
        full: 9999,
    },
    text: {
        sizes: {
            xs: 12,
            s: 14,
            m: 16,
            l: 20,
            xl: 24,
            xxl: 32,
        },
        weights: {
            regular: '400',
            medium: '500',
            bold: '700',
        },
    },
};

export type Theme = typeof theme;
