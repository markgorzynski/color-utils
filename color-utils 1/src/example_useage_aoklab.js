/**
 * example-usage-aoklab.js
 *
 * This script demonstrates how a developer might use the AdaptiveOklab class
 * from the aoklab.js module to perform color transformations, specifically
 * focusing on a white-adapted surround.
 */

// Assuming aoklab.js is in the same directory or resolvable by the module system.
// Adjust the path './aoklab.js' as necessary based on your project structure.
import { AdaptiveOklab } from './aoklab.js';

// --- Main Example Function ---
function demonstrateWhiteAdaptedTransform() {
  console.log("--- Adaptive Oklab: White Surround Example ---");

  // 1. Define an input sRGB color (e.g., a pleasant teal color)
  const inputHexColor = "#4A90E2"; // A nice blue/teal
  console.log(`Input sRGB Hex: ${inputHexColor}`);

  // 2. Create an AdaptiveOklab converter instance for a 'white' surround.
  // We can also specify other options like x0 if needed, but we'll use defaults here.
  const whiteAdaptConverter = new AdaptiveOklab({ surround: 'white' });
  console.log(`Converter configured for: ${whiteAdaptConverter.surround} surround`);

  // 3. Convert the hex color to white-adapted Oklab.
  // We can use the static helper method for convenience.
  let adaptiveOklabColor;
  try {
    adaptiveOklabColor = AdaptiveOklab.fromHex(inputHexColor, { surround: 'white' });
    console.log("White-Adapted Oklab color:", adaptiveOklabColor);
  } catch (error) {
    console.error("Error converting hex to Adaptive Oklab:", error);
    return;
  }

  // 4. Now, let's convert this white-adapted Oklab color back to sRGB hex
  // using the same converter instance to see the result.
  let outputHexColor;
  try {
    outputHexColor = whiteAdaptConverter.toHex(adaptiveOklabColor);
    console.log(`Output sRGB Hex (from white-adapted Oklab): ${outputHexColor}`);
  } catch (error) {
    console.error("Error converting Adaptive Oklab to Hex:", error);
    return;
  }

  // You can also convert to other formats if needed:
  try {
    const outputSrgbObject = whiteAdaptConverter.toSrgb(adaptiveOklabColor);
    console.log("Output sRGB Object:", outputSrgbObject);

    const outputXyzObject = whiteAdaptConverter.toXyz(adaptiveOklabColor);
    console.log("Output XYZ Object:", outputXyzObject);
  } catch (error) {
    console.error("Error in further reverse conversions:", error);
  }

  console.log("\n--- Another Example: Dark Surround ---");
  const darkAdaptConverter = new AdaptiveOklab({ surround: 'dark' });
  try {
    const darkAdaptiveColor = darkAdaptConverter.fromHex(inputHexColor);
    console.log(`Input sRGB Hex: ${inputHexColor}`);
    console.log("Dark-Adapted Oklab color:", darkAdaptiveColor);
    const darkOutputHex = darkAdaptConverter.toHex(darkAdaptiveColor);
    console.log(`Output sRGB Hex (from dark-adapted Oklab): ${darkOutputHex}`);
  } catch (error)
  {
    console.error("Error in dark surround example:", error);
  }
}

// --- Run the demonstration ---
// To run this, you would typically use Node.js with ES module support (e.g., node --experimental-modules example.mjs)
// or include it in an HTML file with <script type="module" src="example.js"></script>,
// ensuring aoklab.js and its dependencies (srgb.js, utils.js) are accessible.

demonstrateWhiteAdaptedTransform();

/*
Expected output might look something like this (exact Oklab values depend on matrix precision):

--- Adaptive Oklab: White Surround Example ---
Input sRGB Hex: #4A90E2
Converter configured for: white surround
White-Adapted Oklab color: { L: 0.6..., a: -0.0..., b: -0.1... }
Output sRGB Hex (from white-adapted Oklab): #4A90E2 (or very close, depending on gamut and precision)
Output sRGB Object: { r: 0.29..., g: 0.56..., b: 0.88... }
Output XYZ Object: { x: 0.2..., y: 0.2..., z: 0.7... }

--- Another Example: Dark Surround ---
Input sRGB Hex: #4A90E2
Dark-Adapted Oklab color: { L: 0.5..., a: -0.0..., b: -0.1... }
Output sRGB Hex (from dark-adapted Oklab): #4A90E2 (or very close)
*/
