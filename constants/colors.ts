import { colors } from '../theme/colors';

// Re-exporting colors to keep it centralized in theme/
// This file serves as a convenient access point for components expecting a 'constants' folder structure
export const Colors = {
    light: {
        tint: colors.light.primary,
        tabIconDefault: colors.light.textSecondary,
        tabIconSelected: colors.light.primary,
        ...colors.light,
    },
    dark: {
        tint: colors.dark.primary,
        tabIconDefault: colors.dark.textSecondary,
        tabIconSelected: colors.dark.primary,
        ...colors.dark,
    },
};
