// See https://en.wikipedia.org/wiki/Middle_gray
export const DARK: Color = { r: 0, g: 0, b: 0 };
export const MID: Color = { r: 119, g: 119, b: 119 };
export const LIGHT: Color = { r: 255, g: 255, b: 255 };

type Color = { r: number, g: number, b: number };

// sRGB linearization, see https://en.wikipedia.org/wiki/SRGB
export function toLinear(sRgbChannel: number): number {
    if (sRgbChannel <= 0.04045) {
        return sRgbChannel / 12.92;
    } else {
        return Math.pow(((sRgbChannel + 0.055) / 1.055), 2.4);
    }
}

// calculate luminance (Y), see https://en.wikipedia.org/wiki/SRGB#From_sRGB_to_CIE_XYZ
export function toRelativeLuminance(linear: Color): number {
    const { r, g, b } = linear;

    return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

// perceptual lightness (L*) according to CIELAB, see https://en.wikipedia.org/wiki/CIELAB_color_space
// derived from https://stackoverflow.com/a/56678483
export function toLightness(luminance: number) {
    if (luminance <= (216 / 24389)) {
        return luminance * (24389 / 27);
    } else {
        return Math.pow(luminance, (1 / 3)) * 116 - 16;
    }
};

export function toContrastingColor(luminance: number): Color {
    const lightness = toLightness(luminance);

    return lightness >= 50 ? DARK : LIGHT;
}

export function colorToHex({r, g, b}: Color) {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
