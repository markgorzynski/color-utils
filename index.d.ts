/**
 * TypeScript definitions for color-utils
 * A comprehensive color science library for adaptive visual perception modeling
 */

declare module 'color-utils' {
  
  // ============= Color Type Definitions =============
  
  /** sRGB color with components in [0,1] range */
  export interface SrgbColor {
    r: number;
    g: number;
    b: number;
  }

  /** Linear sRGB color (gamma-decoded) */
  export interface LinearSrgbColor {
    r: number;
    g: number;
    b: number;
  }

  /** CIE XYZ color with Y normalized to 1 for white point */
  export interface XyzColor {
    X: number;
    Y: number;
    Z: number;
  }

  /** CIELAB color space */
  export interface LabColor {
    L: number;  // Lightness [0, 100]
    a: number;  // Green-red axis (unbounded, typically ±128)
    b: number;  // Blue-yellow axis (unbounded, typically ±128)
  }

  /** CIELCH color space (cylindrical Lab) */
  export interface LchColor {
    L: number;  // Lightness [0, 100]
    C: number;  // Chroma [0, ∞)
    h: number;  // Hue [0, 360)
  }

  /** Oklab perceptual color space */
  export interface OklabColor {
    L: number;  // Lightness [0, 1]
    a: number;  // Green-red axis (unbounded, typically ±0.4)
    b: number;  // Blue-yellow axis (unbounded, typically ±0.4)
  }

  /** OkLCH color space (cylindrical Oklab) */
  export interface OklchColor {
    L: number;  // Lightness [0, 1]
    C: number;  // Chroma [0, ∞)
    h: number;  // Hue [0, 360)
  }

  /** Display P3 color space */
  export interface DisplayP3Color {
    r: number;
    g: number;
    b: number;
  }

  /** Rec. 2020 color space */
  export interface Rec2020Color {
    r: number;
    g: number;
    b: number;
  }

  /** CIECAM16 appearance correlates */
  export interface Ciecam16Appearance {
    J: number;  // Lightness
    C: number;  // Chroma
    h: number;  // Hue angle
    M: number;  // Colorfulness
    s: number;  // Saturation
    Q: number;  // Brightness
  }

  /** CAM16-UCS uniform color space */
  export interface Cam16UcsColor {
    J: number;  // Lightness
    a: number;  // Red-green
    b: number;  // Yellow-blue
  }

  // ============= Option Types =============

  /** Viewing conditions for CIECAM16 */
  export interface Ciecam16ViewingConditions {
    referenceWhite?: XyzColor;
    adaptingLuminance: number;
    backgroundLuminanceFactor: number;
    surroundType: 'average' | 'dim' | 'dark';
    degreeOfAdaptation?: number;
  }

  /** Adaptive Oklab options */
  export interface AdaptiveOklabOptions {
    surround?: 'white' | 'gray' | 'dark';
    x0?: number;
  }

  /** WCAG contrast levels */
  export type WcagLevel = 'AA' | 'AAA';
  export type WcagSize = 'normal' | 'large';

  /** Chromatic adaptation methods */
  export type ChromaticAdaptationMethod = 'bradford' | 'cat02' | 'cat16' | 'vonKries';

  /** Standard illuminants */
  export type Illuminant = 'A' | 'C' | 'D50' | 'D55' | 'D65' | 'D75' | 'E' | 
                           'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 
                           'F9' | 'F10' | 'F11' | 'F12';

  // ============= sRGB Functions =============

  export function srgbToLinearSrgb(srgb: SrgbColor): LinearSrgbColor;
  export function linearSrgbToSrgb(linear: LinearSrgbColor): SrgbColor;
  export function srgbToXyz(srgb: SrgbColor): XyzColor;
  export function xyzToSrgb(xyz: XyzColor): SrgbColor;
  export function linearSrgbToXyz(linear: LinearSrgbColor): XyzColor;
  export function xyzToLinearSrgb(xyz: XyzColor): LinearSrgbColor;
  export function parseSrgbHex(hex: string): SrgbColor | null;
  export function formatSrgbAsHex(srgb: SrgbColor): string;

  // ============= CIELAB Functions =============

  export function srgbToLab(srgb: SrgbColor): LabColor;
  export function labToSrgb(lab: LabColor): SrgbColor;
  export function xyzToLab(xyz: XyzColor, referenceWhite?: XyzColor): LabColor;
  export function labToXyz(lab: LabColor, referenceWhite?: XyzColor): XyzColor;
  export function labToLch(lab: LabColor): LchColor;
  export function lchToLab(lch: LchColor): LabColor;
  export function srgbToLch(srgb: SrgbColor): LchColor;
  export function lchToSrgb(lch: LchColor): SrgbColor;

  // ============= Oklab Functions =============

  export function srgbToOklab(srgb: SrgbColor): OklabColor;
  export function oklabToSrgb(oklab: OklabColor): SrgbColor;
  export function linearSrgbToOklab(linear: LinearSrgbColor): OklabColor;
  export function oklabToLinearSrgb(oklab: OklabColor): LinearSrgbColor;
  export function oklabToOklch(oklab: OklabColor): OklchColor;
  export function oklchToOklab(oklch: OklchColor): OklabColor;
  export function srgbToOklch(srgb: SrgbColor): OklchColor;
  export function oklchToSrgb(oklch: OklchColor): SrgbColor;

  // ============= Adaptive Oklab Class =============

  export class AdaptiveOklab {
    constructor(options?: AdaptiveOklabOptions);
    
    readonly surround: 'white' | 'gray' | 'dark';
    readonly params: {
      FL: number;
      x0: number;
      correctionFactor: number;
      surround: string;
    };
    
    fromSrgb(srgb: SrgbColor): OklabColor;
    fromXyz(xyz: XyzColor): OklabColor;
    toSrgb(oklab: OklabColor): SrgbColor;
    toXyz(oklab: OklabColor): XyzColor;
    toLinearSrgb(oklab: OklabColor): LinearSrgbColor;
    toHex(oklab: OklabColor): string;
    
    static fromHex(hex: string, options?: AdaptiveOklabOptions): OklabColor;
  }

  // ============= Display P3 Functions =============

  export function srgbToDisplayP3(srgb: SrgbColor): DisplayP3Color;
  export function displayP3ToSrgb(p3: DisplayP3Color): SrgbColor;
  export function linearSrgbToLinearDisplayP3(linear: LinearSrgbColor): DisplayP3Color;
  export function linearDisplayP3ToLinearSrgb(p3: DisplayP3Color): LinearSrgbColor;
  export function parseDisplayP3FromCSS(css: string): DisplayP3Color | null;

  // ============= Rec. 2020 Functions =============

  export function srgbToRec2020(srgb: SrgbColor): Rec2020Color;
  export function rec2020ToSrgb(rec2020: Rec2020Color): SrgbColor;
  export function linearSrgbToLinearRec2020(linear: LinearSrgbColor): Rec2020Color;
  export function linearRec2020ToLinearSrgb(rec2020: Rec2020Color): LinearSrgbColor;
  export function parseRec2020FromCSS(css: string): Rec2020Color | null;

  // ============= Color Metrics =============

  export function getSrgbRelativeLuminance(srgb: SrgbColor): number;
  export function calculateWcagContrast(fg: SrgbColor, bg: SrgbColor): number;
  export function isWcagContrastSufficient(
    fg: SrgbColor, 
    bg: SrgbColor, 
    level: WcagLevel, 
    size?: WcagSize
  ): boolean;
  export function calculateCiede2000(lab1: LabColor, lab2: LabColor): number;
  export function calculateOklchDifference(oklch1: OklchColor, oklch2: OklchColor): number;

  // ============= Gamut Management =============

  export function isSrgbInGamut(srgb: SrgbColor, epsilon?: number): boolean;
  export function isLabInTypicalRange(lab: LabColor): boolean;
  export function isOklabInTypicalRange(oklab: OklabColor): boolean;
  export function isValidSrgbObject(obj: any): obj is SrgbColor;
  export function isValidLabObject(obj: any): obj is LabColor;
  export function clampSrgb(srgb: SrgbColor): SrgbColor;
  export function scaleToSrgbGamut(srgb: SrgbColor): SrgbColor;
  export function clamp(value: number, min: number, max: number): number;
  
  export interface GamutInfo {
    inGamut: boolean;
    channels: number[];
    maxExcess: number;
    minDeficit: number;
  }
  
  export function getSrgbGamutInfo(srgb: SrgbColor): GamutInfo;
  export function getMaxChroma(
    L: number, 
    h: number, 
    space?: 'lch' | 'oklch', 
    precision?: number
  ): number;

  // ============= Gamut Mapping =============

  export function gamutMapOklch(
    oklch: OklchColor, 
    targetGamut: 'srgb' | 'display-p3' | 'rec2020'
  ): OklchColor;
  
  export function gamutMapSrgb(
    srgb: SrgbColor, 
    targetGamut: 'srgb' | 'display-p3' | 'rec2020'
  ): SrgbColor;
  
  export function isInGamut(
    color: any, 
    colorSpace: string, 
    targetGamut: string
  ): boolean;
  
  export function clipGamutMapping(color: SrgbColor): SrgbColor;
  export function cuspGamutMapping(
    oklch: OklchColor, 
    targetGamut: string
  ): OklchColor;

  // ============= CSS Color Parsing =============

  export function parseCSS(css: string): SrgbColor | null;
  export function formatCssRgb(srgb: SrgbColor): string;
  export function formatCssLab(lab: LabColor): string;
  export function formatCssLch(lch: LchColor): string;
  export function formatCssOklab(oklab: OklabColor): string;
  export function formatCssOklch(oklch: OklchColor): string;
  export function formatCssColor(
    color: DisplayP3Color | Rec2020Color, 
    space: 'display-p3' | 'rec2020'
  ): string;

  // ============= CIECAM16 =============

  export function srgbToCiecam16(
    srgb: SrgbColor, 
    conditions: Ciecam16ViewingConditions
  ): Ciecam16Appearance;

  // ============= CAM16-UCS =============

  export function srgbToCam16Ucs(
    srgb: SrgbColor, 
    conditions: Ciecam16ViewingConditions
  ): Cam16UcsColor;
  
  export function cam16UcsToSrgb(
    ucs: Cam16UcsColor, 
    conditions: Ciecam16ViewingConditions
  ): SrgbColor | null;
  
  export function cam16UcsColorDifference(
    ucs1: Cam16UcsColor, 
    ucs2: Cam16UcsColor
  ): number;

  // ============= Chromatic Adaptation =============

  export interface ChromaticAdaptationResult extends XyzColor {}

  export function chromaticAdaptation(
    xyz: XyzColor,
    sourceWhite: Illuminant | XyzColor,
    destWhite: Illuminant | XyzColor,
    method?: ChromaticAdaptationMethod
  ): ChromaticAdaptationResult;

  export function xyzD65ToD50(xyz: XyzColor): XyzColor;
  export function xyzD50ToD65(xyz: XyzColor): XyzColor;
  export function calculateCCT(xyz: XyzColor): number;

  export const ILLUMINANTS: Record<Illuminant, XyzColor>;

  // ============= Chroma Control =============

  export function findMaxAokChromaForLabL(
    hue: number,
    targetLabL: number,
    options?: any
  ): number;

  export function adjustAokColorToLabL(
    inputLCH: { C: number; h: number },
    targetLabL: number,
    mode: 'clip' | 'target',
    options?: any
  ): {
    aokLCH: OklchColor;
    srgbColor: SrgbColor;
    relativeLuminanceY: number;
    outOfGamut: boolean;
    iterations: number;
  };

  // ============= Utility Functions =============

  export function degreesToRadians(degrees: number): number;
  export function radiansToDegrees(radians: number): number;
  export function normalizeHue(hue: number): number;
  export function signPreservingPow(base: number, exponent: number): number;
  export function multiplyMatrixVector(
    matrix: readonly (readonly number[])[],
    vector: readonly number[]
  ): number[];
}