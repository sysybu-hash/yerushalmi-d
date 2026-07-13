import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const { BACKGROUND_PRESETS } = await import(
  "../lib/studio-beta/backgrounds.ts"
);
const { buildBackgroundOnlyPrompt } = await import(
  "../lib/studio-beta/prompts.ts"
);
const { generateOrEditImage } = await import(
  "../lib/studio-beta/gemini-client.ts"
);
const { uploadToCloudinary } = await import(
  "../lib/studio-beta/cloudinary-upload.ts"
);

const results = [];

for (const preset of BACKGROUND_PRESETS) {
  process.stdout.write(`generating ${preset.id}... `);
  try {
    const { dataUri, modelId } = await generateOrEditImage({
      prompt: buildBackgroundOnlyPrompt(preset.hint),
    });
    const uploaded = await uploadToCloudinary({
      source: dataUri,
      resourceType: "image",
      filenamePrefix: `studio-beta-bg-library-${preset.id}`,
    });
    console.log(`ok (${modelId}) -> ${uploaded.url}`);
    results.push({ id: preset.id, url: uploaded.url, modelId });
  } catch (err) {
    console.log(`FAILED: ${err?.message ?? err}`);
    results.push({ id: preset.id, url: null, error: String(err?.message ?? err) });
  }
}

console.log("\n=== RESULTS JSON ===");
console.log(JSON.stringify(results, null, 2));
