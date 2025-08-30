/**
 * @file example_usage_aoklab.js
 * @description This script demonstrates usage of the AdaptiveOklab class from
 * aoklab.js and the advanced functions from chromaControl.js to generate
 * surround-adapted color sequences with controlled luminance for consistent WCAG contrast.
 */

// Adjust paths based on your project structure.
// Assuming all color-utils modules are exported via a main index.js in './color-utils'
import {
  AdaptiveOklab,
  findMaxAokChromaForLabL,
  adjustAokColorToLabL,
  // For verification or direct use if needed:
  // getSrgbRelativeLuminance,
  // calculateWcagContrast,
  // parseSrgbHex,
  // formatSrgbAsHex
} from './color-utils/index.js'; // Or directly from './aoklab.js' and './chromaControl.js'

// --- Helper function to log color details ---
function logColorResult(label, result, targetLabL) {
  if (!result) {
    console.log(`${label}: No result.`);
    return;
  }
  console.log(
    `${label}: AOkLCH={ L:${result.aokLCH.L.toFixed(3)}, C:${result.aokLCH.C.toFixed(3)}, h:${result.aokLCH.h.toFixed(1)} } -> sRGB Hex: ${result.srgbColor ? result.srgbColor.hex : 'N/A'} (Y_cie: ${result.relativeLuminanceY.toFixed(4)})${result.outOfGamut ? ' [OOG]' : ''} (Target L*${targetLabL})`
  );
  // You could add WCAG contrast calculation here if you have a fixed background
  // const BG_COLOR_HEX = "#FFFFFF"; // Example background
  // if (result.srgbColor && result.srgbColor.hex) {
  //   const contrast = calculateWcagContrast(result.srgbColor.hex, BG_COLOR_HEX);
  //   console.log(`    WCAG Contrast vs ${BG_COLOR_HEX}: ${contrast.toFixed(2)}:1`);
  // }
}


// --- Use Case 1: Chroma Ramp ---
// Goal: Constant AOkLab Hue, constant target CIELAB L* (for constant WCAG contrast),
// varying AOkLab Chroma from 0 to max, under a 'white' surround.
function demonstrateChromaRamp() {
  console.log("\n--- Use Case 1: Chroma Ramp (Constant AOkLab Hue & CIELAB L*) ---");

  const L_target_lab = 60; // Target CIELAB L* for all colors in the ramp
  const H_target_aok = 265; // Target AOkLab Hue (an indigo/blue)
  const aokOptions = { adaptiveOklabOptions: { surround: 'white', x0: 0.5 } };
  const numChromaSteps = 5; // Generate 5 steps + neutral

  console.log(`Targeting CIELAB L* ≈ ${L_target_lab}, AOkLab Hue = ${H_target_aok}, Surround = '${aokOptions.adaptiveOklabOptions.surround}'`);

  // 1. Find the maximum AOkLab Chroma possible for this Hue at the target CIELAB L*'s luminance
  let C_max_aok;
  try {
    C_max_aok = findMaxAokChromaForLabL(H_target_aok, L_target_lab, aokOptions);
    console.log(`Max achievable AOkLab Chroma (C_max_aok) for H=${H_target_aok} at L*=${L_target_lab}: ${C_max_aok.toFixed(3)}`);
  } catch (error) {
    console.error("Error finding max AOkLab Chroma:", error);
    return;
  }

  if (C_max_aok <= 0) {
      console.log("Max chroma is 0 or less, cannot generate a meaningful chroma ramp.");
      // Still, let's generate the neutral
      try {
        const neutralHint = { C: 0, h: H_target_aok };
        const resultNeutral = adjustAokColorToLabL(neutralHint, L_target_lab, 'target', {
          ...aokOptions,
          globalTargetAokChroma: 0
        });
        logColorResult(`Chroma Step (Neutral C=0)`, resultNeutral, L_target_lab);
      } catch(error) {
        console.error("Error generating neutral color for chroma ramp:", error);
      }
      return;
  }

  // 2. Generate colors for each chroma step
  console.log("\nChroma Ramp Colors:");
  for (let i = 0; i <= numChromaSteps; i++) {
    const C_step_aok = (i / numChromaSteps) * C_max_aok;
    const stepLabel = `C_aok = ${C_step_aok.toFixed(3)} (Step ${i}/${numChromaSteps})`;

    try {
      const inputAokColorHint = { C: C_step_aok, h: H_target_aok };
      // L in hint is ignored by adjustAokColorToLabL, it solves for AOkLab L

      const result = adjustAokColorToLabL(
        inputAokColorHint,
        L_target_lab,
        'target', // Use 'target' mode since we are providing the exact C_step_aok
        {
          ...aokOptions, // Includes adaptiveOklabOptions
          globalTargetAokChroma: C_step_aok
        }
      );
      logColorResult(stepLabel, result, L_target_lab);

      // For verification: The 'result.relativeLuminanceY' should be very similar for all steps.
      // The 'result.aokLCH.L' will vary for each step to achieve that constant luminance.
    } catch (error) {
      console.error(`Error generating color for ${stepLabel}:`, error);
    }
  }
}

// --- Use Case 2: Hue Ramp ---
// Goal: Varying AOkLab Hue, constant target CIELAB L*, maximum AOkLab Chroma
// for each hue at that target L*, under a 'white' surround.
function demonstrateHueRamp() {
  console.log("\n--- Use Case 2: Hue Ramp (Varying AOkLab Hue, Constant CIELAB L*, Max AOkLab Chroma) ---");

  const L_target_lab = 60; // Target CIELAB L*
  const aokOptions = { adaptiveOklabOptions: { surround: 'white', x0: 0.5 } };
  const H_start_aok = 200;
  const H_end_aok = 300;
  const H_increment = 20; // Steps of 20 degrees for hue

  console.log(`Targeting CIELAB L* ≈ ${L_target_lab}, Surround = '${aokOptions.adaptiveOklabOptions.surround}'`);
  console.log(`AOkLab Hue Ramp from ${H_start_aok}° to ${H_end_aok}° (step ${H_increment}°), Max Chroma for each hue.`);

  // 1. Generate colors for each hue step
  console.log("\nHue Ramp Colors:");
  for (let H_step_aok = H_start_aok; H_step_aok <= H_end_aok; H_step_aok += H_increment) {
    const stepLabel = `H_aok = ${H_step_aok.toFixed(1)}°`;

    try {
      // 1a. Find max AOkLab Chroma for this specific Hue and target CIELAB L*
      const C_max_for_this_hue_aok = findMaxAokChromaForLabL(
        H_step_aok,
        L_target_lab,
        aokOptions
      );
      // console.log(`    ${stepLabel} -> Max achievable C_aok: ${C_max_for_this_hue_aok.toFixed(3)}`);

      if (C_max_for_this_hue_aok < 0.001 && H_step_aok !== 0) { // Check if max chroma is practically zero
          console.log(`    ${stepLabel} -> Max chroma near zero, likely achromatic at target L*. Generating neutral.`);
          // Fallback to neutral if no meaningful chroma can be found
          const neutralHint = { C: 0, h: H_step_aok };
           const resultNeutral = adjustAokColorToLabL(neutralHint, L_target_lab, 'target', {
              ...aokOptions,
              globalTargetAokChroma: 0
           });
           logColorResult(stepLabel + " (Neutral Fallback)", resultNeutral, L_target_lab);
           continue;
      }


      // 1b. Generate the color using this max chroma as the target
      const inputAokColorHint = { C: C_max_for_this_hue_aok, h: H_step_aok };

      const result = adjustAokColorToLabL(
        inputAokColorHint,
        L_target_lab,
        'target', // Use 'target' as we are aiming for the C_max_for_this_hue_aok
        {
          ...aokOptions,
          globalTargetAokChroma: C_max_for_this_hue_aok
        }
      );
      logColorResult(stepLabel, result, L_target_lab);

      // For verification: 'result.relativeLuminanceY' should be similar for all steps.
      // 'result.aokLCH.C' will be C_max_for_this_hue_aok and will vary.
      // 'result.aokLCH.L' will vary to maintain constant luminance.
    } catch (error) {
      console.error(`Error generating color for ${stepLabel}:`, error);
    }
  }
}


// --- Original AOkLab Demonstration (from your example_useage_aoklab.js) ---
function demonstrateBasicAoklabTransforms() {
  console.log("\n--- Basic Adaptive Oklab Transformation Examples ---");

  const inputHexColor = "#4A90E2"; // A nice blue/teal
  console.log(`Input sRGB Hex: ${inputHexColor}`);

  // White Surround
  try {
    const whiteAdaptConverter = new AdaptiveOklab({ surround: 'white' });
    console.log(`Converter configured for: ${whiteAdaptConverter.surround} surround`);
    const adaptiveOklabWhite = AdaptiveOklab.fromHex(inputHexColor, { surround: 'white' });
    console.log("White-Adapted Oklab color:", adaptiveOklabWhite);
    const outputHexWhite = whiteAdaptConverter.toHex(adaptiveOklabWhite);
    console.log(`Output sRGB Hex (from white-adapted): ${outputHexWhite}`);
  } catch (error) {
    console.error("Error in white surround example:", error);
  }

  // Dark Surround
  try {
    const darkAdaptConverter = new AdaptiveOklab({ surround: 'dark' });
    console.log(`\nConverter configured for: ${darkAdaptConverter.surround} surround`);
    const adaptiveOklabDark = darkAdaptConverter.fromHex(inputHexColor, { surround: 'dark' });
    console.log("Dark-Adapted Oklab color:", adaptiveOklabDark);
    const outputHexDark = darkAdaptConverter.toHex(adaptiveOklabDark);
    console.log(`Output sRGB Hex (from dark-adapted): ${outputHexDark}`);
  } catch (error) {
    console.error("Error in dark surround example:", error);
  }
}

// --- Run the demonstrations ---
// To execute this script (e.g., with Node.js):
// 1. Ensure your color-utils modules (aoklab.js, chromaControl.js, srgb.js, etc.)
//    are correctly structured and export their functions.
// 2. Ensure this script correctly imports from your color-utils library
//    (e.g., from './color-utils/index.js' or individual module files).
// 3. Run: `node example_usage_aoklab.js` (or your chosen filename)

demonstrateBasicAoklabTransforms(); // Original examples
demonstrateChromaRamp();
demonstrateHueRamp();

/*
Expected output format for new examples:

--- Use Case 1: Chroma Ramp (Constant AOkLab Hue & CIELAB L*) ---
Targeting CIELAB L* ≈ 60, AOkLab Hue = 265, Surround = 'white'
Max achievable AOkLab Chroma (C_max_aok) for H=265 at L*=60: 0.123 (example value)

Chroma Ramp Colors:
C_aok = 0.000 (Step 0/5): AOkLCH={ L:0.678, C:0.000, h:265.0 } -> sRGB Hex: #A0A0A0 (Y_cie: 0.2971) [OOG optional] (Target L*60)
C_aok = 0.025 (Step 1/5): AOkLCH={ L:0.685, C:0.025, h:265.0 } -> sRGB Hex: #..... (Y_cie: 0.2970) (Target L*60)
...

--- Use Case 2: Hue Ramp (Varying AOkLab Hue, Constant CIELAB L*, Max AOkLab Chroma) ---
Targeting CIELAB L* ≈ 60, Surround = 'white'
AOkLab Hue Ramp from 200° to 300° (step 20°), Max Chroma for each hue.

Hue Ramp Colors:
H_aok = 200.0°: AOkLCH={ L:0.690, C:0.080, h:200.0 } -> sRGB Hex: #..... (Y_cie: 0.2972) (Target L*60)
H_aok = 220.0°: AOkLCH={ L:0.670, C:0.110, h:220.0 } -> sRGB Hex: #..... (Y_cie: 0.2969) (Target L*60)
...
*/