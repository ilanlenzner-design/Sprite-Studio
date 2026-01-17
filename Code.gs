/**
 * Sprite Sheet Converter - Google Apps Script Backend
 * Handles web app serving and Replicate API proxying
 */

const REPLICATE_API_KEY = 'YOUR_REPLICATE_API_KEY_HERE';
const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY_HERE';

function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Sprite Sheet Converter | Video ⟷ Sprite')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Helper to include other HTML files (Styles, Javascript)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Proxy function to call Replicate LLM for grid detection
 * @param {string} base64Image - The image data as a base64 string
 * @param {number} origWidth - Original width of the image
 * @param {number} origHeight - Original height of the image
 * @param {number} hintRows - Suggested rows from local scan
 * @param {number} hintCols - Suggested columns from local scan
 */
function detectGridFromReplicate(base64Image, origWidth, origHeight, hintRows, hintCols) {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|webp);base64,/, "");
    const versionHash = "80537f9eead1a5bfa72d5ac6ea6414379be41d4d4f6679fd776e9535d1eb58bb";
    
    const aspectRatio = (origWidth / origHeight).toFixed(2);
    const prompt = "SPRITE SHEET EXPERT DETECTION:\n" +
      "Analyze this pixel art sheet.\n" +
      "Total Image Size: " + origWidth + "x" + origHeight + " pixels.\n\n" +
      "STEP-BY-STEP ANALYSIS:\n" +
      "1. Identify a SINGLE frame or sprite. How many pixels wide and tall is it roughly?\n" +
      "2. Count the sprites in the TOP ROW.\n" +
      "3. Count the total rows.\n" +
      "4. Mathematical Check: Does (Count times FrameSize) roughly equal Total Image Size?\n" +
      "5. Special Note: If it is the 4x8 Lava Sheet, look for 8 horizontal frames and 4 vertical rows.\n\n" +
      "Respond ONLY with a JSON object: {\\\"rows\\\": X, \\\"columns\\\": Y, \\\"reasoning\\\": \\\"description\\\"}.";

    console.log(`Auditing grid: ${hintRows}x${hintCols} (Size: ${origWidth}x${origHeight})`);

    const payload = {
      version: versionHash,
      input: {
        image: base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${cleanBase64}`,
        prompt: prompt
      }
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': `Token ${REPLICATE_API_KEY}` },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch('https://api.replicate.com/v1/predictions', options);
    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() !== 201) {
      throw new Error(`Replicate API error: ${result.detail || response.getContentText()}`);
    }

    const predictionId = result.id;
    let prediction;
    for (let i = 0; i < 15; i++) {
        Utilities.sleep(1000);
        const pollResponse = UrlFetchApp.fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: { 'Authorization': `Token ${REPLICATE_API_KEY}` }
        });
        prediction = JSON.parse(pollResponse.getContentText());
        if (prediction.status === 'succeeded') break;
        if (prediction.status === 'failed') throw new Error(`Model prediction failed for ID: ${predictionId}`);
    }

    if (!prediction || prediction.status !== 'succeeded') {
        throw new Error('Timeout or failure waiting for model prediction');
    }

    let outputString = Array.isArray(prediction.output) ? prediction.output.join("") : (prediction.output || "");
    console.log(`Model raw output: ${outputString}`);
    
    outputString = outputString.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = outputString.match(/\{.*\}/s);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`Detected Grid: Rows=${parsed.rows}, Cols=${parsed.columns}`);
      return parsed;
    } else {
      throw new Error('Could not parse grid dimensions from model output');
    }

  } catch (error) {
    console.error('LLM Detection Error:', error);
    throw new Error(`Detection failed: ${error.message}`);
  }
}

/**
 * Detects sprite sheet grid using simple heuristic (aspect ratio + common sizes)
 */
function detectGridFromNanoBananaPro(base64Image, origWidth, origHeight, hintRows, hintCols) {
  try {
    // SIMPLE STRATEGY: Check grids from SMALLEST to LARGEST
    // Pick the FIRST one with reasonable cell sizes
    console.log(`Simple detection for ${origWidth}x${origHeight}`);
    
    // Test grids in order of increasing size (prefer small grids)
    const gridsToTest = [];
    
    // Generate test candidates from 2x2 to 25x25
    for (let size = 2; size <= 25; size++) {
      gridsToTest.push({ cols: size, rows: size }); // Square grids first
      
      // Also test nearby rectangular grids
      if (size > 2) {
        gridsToTest.push({ cols: size, rows: size - 1 });
        gridsToTest.push({ cols: size - 1, rows: size });
        gridsToTest.push({ cols: size, rows: size + 1 });
        gridsToTest.push({ cols: size + 1, rows: size });
      }
    }
    
    // Test each grid in order
    for (let grid of gridsToTest) {
      const cellWidth = origWidth / grid.cols;
      const cellHeight = origHeight / grid.rows;
      
      // Check if cell sizes are reasonable (between 50px and 600px)
      const minCellSize = 50;
      const maxCellSize = 600;
      
      if (cellWidth >= minCellSize && cellWidth <= maxCellSize &&
          cellHeight >= minCellSize && cellHeight <= maxCellSize) {
        
        // Check if cells are reasonably square (aspect ratio between 0.5 and 2.0)
        const aspectRatio = cellWidth / cellHeight;
        if (aspectRatio >= 0.5 && aspectRatio <= 2.0) {
          console.log(`Detected: ${grid.rows}x${grid.cols} (cells: ${Math.round(cellWidth)}x${Math.round(cellHeight)}px)`);
          
          return {
            rows: grid.rows,
            columns: grid.cols,
            reasoning: `Simple detection: ${grid.cols}×${grid.rows} grid (${Math.round(cellWidth)}×${Math.round(cellHeight)}px cells)`
          };
        }
      }
    }
    
    // Fallback: assume 8x8 if nothing worked
    console.log('No suitable grid found, defaulting to 8x8');
    return {
      rows: 8,
      columns: 8,
      reasoning: 'Fallback: 8×8 grid'
    };
  } catch (error) {
    console.error('Heuristic Error:', error);
    // Fallback: assume square cells
    const avgDim = Math.sqrt(origWidth * origHeight);
    const cellSize = 64; // common default
    return {
      rows: Math.round(origHeight / cellSize),
      columns: Math.round(origWidth / cellSize),
      reasoning: 'Fallback: assumed 64px cells'
    };
  }
}

/**
 * AI-POWERED NORMALIZATION: Fetches individual sprite bounding boxes
 */
function getIslandsFromNanoBananaPro(base64Image, origWidth, origHeight, hintRows, hintCols) {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|webp);base64,/, "");
    const mimeType = base64Image.match(/^data:(image\/[a-z]+);base64/)?.[1] || "image/png";

    const prompt = `SPRITE OBJECT DETECTOR:
Examine this sprite sheet and identify EVERY unique animation frame.
Image Size: ${origWidth}x${origHeight} pixels.

TASK:
1. Detect a tight **Bounding Box (islands)** for each sprite that includes ALL visible effects (smoke, glows).
2. Identify the **Pivot Anchor (anchors)** for each sprite (e.g., center of the base).

Return a JSON object:
{
  "islands": [[ymin, xmin, ymax, xmax], ...],
  "anchors": [[y, x], ...],
  "rows": ${hintRows},
  "cols": ${hintCols}
}`;

    const payload = {
      contents: [{
        parts: [{ text: prompt }, { inlineData: { mimeType: mimeType, data: cleanBase64 } }]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`;
    const options = {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify(payload), muteHttpExceptions: true,
      followRedirects: true,
      timeout: 60000
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    if (response.getResponseCode() !== 200) throw new Error(result.error?.message || response.getContentText());

    let outputText = result.candidates[0].content.parts[0].text;
    // Robust JSON extraction
    const jsonMatch = outputText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not find JSON in AI response: ' + outputText);
    
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.anchors || !Array.isArray(parsed.anchors)) {
      throw new Error("AI failed to identify anchor points. Please try again.");
    }
    
    const formattedAnchors = parsed.anchors.map(arr => {
      return { y: (arr[0] / 1000) * origHeight, x: (arr[1] / 1000) * origWidth };
    });

    const formattedIslands = (parsed.islands || []).map(box => {
      return {
        minY: (box[0] / 1000) * origHeight,
        minX: (box[1] / 1000) * origWidth,
        maxY: (box[2] / 1000) * origHeight,
        maxX: (box[3] / 1000) * origWidth
      };
    });

    return {
      anchors: formattedAnchors,
      islands: formattedIslands,
      rows: parsed.rows || hintRows,
      cols: parsed.cols || hintCols,
      reasoning: parsed.reasoning || ""
    };
  } catch (error) {
    console.error('AI Error:', error);
    throw new Error(`AI Normalizer failed: ${error.message}`);
  }
}
