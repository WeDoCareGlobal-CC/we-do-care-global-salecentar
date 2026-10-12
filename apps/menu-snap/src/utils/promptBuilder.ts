import { DishItem, StylePreset, SurfaceOption, SteamOption, DepthOfField, PhotoShootConfig } from '../types';

export function buildFoodPhotoPrompt(dish: DishItem, config?: Partial<PhotoShootConfig>): string {
  const style = dish.selectedStyle || config?.globalStyle || 'Bright/Modern';
  const surface = config?.surface || 'Carrara Marble';
  const steam = config?.steam || 'Subtle Steam';
  const depth = config?.depthOfField || 'Cinematic Shallow Macro';

  let styleDescription = '';
  let lightingAndBackground = '';
  let angleAndComposition = '';

  switch (style) {
    case 'Rustic/Dark':
      styleDescription = 'Moody, dramatic, rustic artisanal style food photography.';
      lightingAndBackground = `Background of dark weathered wood or dark charcoal slate (${surface}). Warm directional side-lighting casting rich soft shadows and glistening food highlights. Artisanal pottery, matte dark cutlery, and subtle dusted flour or linen accents.`;
      angleAndComposition = '45-degree classic restaurant table perspective highlighting depth and surface sheen.';
      break;

    case 'Bright/Modern':
      styleDescription = 'Clean, bright, high-end modern commercial studio food photography.';
      lightingAndBackground = `Background of pristine white Italian Carrara marble or bright neutral studio surface (${surface}). Bathed in soft, diffused natural daylight from a large window. Bright white ceramic plate, crisp vibrant colors, clean minimal cutlery.`;
      angleAndComposition = '30-degree dynamic angle focusing on crisp textures and vivid ingredients.';
      break;

    case 'Social Media':
      styleDescription = 'Trend-forward 90-degree top-down flatlay social media food photography.';
      lightingAndBackground = `Background of stylish textured neutral surface (${surface}). Artistic scattering of fresh raw ingredient props around the plate (fresh herbs, peppercorns, lemon slices, coarse salt crystals). Perfectly balanced overhead flatlay layout for Instagram magazine cover.`;
      angleAndComposition = 'Direct 90-degree overhead flatlay bird-eye perspective.';
      break;

    case 'Fine Dining':
      styleDescription = 'Michelin-star luxury fine dining culinary photography.';
      lightingAndBackground = `Background of sleek dark ambient dining table with precise pinpoint spotlight focusing strictly on the dish. Gold or matte black premium cutlery, crystal glass in soft background bokeh. Precise architectural chef plating.`;
      angleAndComposition = 'Low-angle macro shot accentuating height, garnishes, and luxury plate geometry.';
      break;

    case 'Cozy Cafe':
      styleDescription = 'Warm, inviting, sun-drenched bistro cafe food photography.';
      lightingAndBackground = `Background of warm honey oak wooden table near a sunny cafe window with dreamy soft bokeh background. Cozy linen napkin, warm inviting aesthetic with golden hour glow.`;
      angleAndComposition = 'Close-up table setting perspective, feeling freshly served.';
      break;
  }

  // Steam modifier
  let steamText = '';
  if (steam === 'Hot Steam & Sizzle') {
    steamText = 'Delicate visible wisps of hot steam rising gently off the warm food, indicating fresh off the stove heat.';
  } else if (steam === 'Ice & Condensation') {
    steamText = 'Chilled vessel with glistening ice crystals and fine cold water condensation droplets clinging to the glass or bowl.';
  } else if (steam === 'Subtle Steam') {
    steamText = 'Subtle glisten and light thermal freshness on the food surface.';
  }

  // Depth modifier
  let depthText = '';
  if (depth === 'Cinematic Shallow Macro') {
    depthText = 'Shot with a 85mm f/1.4 prime lens with shallow depth of field, sharp crisp focus on the hero ingredient with buttery soft background bokeh.';
  } else if (depth === 'Deep Sharp Focus') {
    depthText = 'Shot with a 50mm f/8 lens ensuring razor-sharp clarity across the entire dish and surrounding table props.';
  } else {
    depthText = 'Professional 50mm lens with balanced focus depth.';
  }

  // Custom modifications if any
  const customNote = dish.customPrompt ? ` Special instruction: ${dish.customPrompt}.` : '';

  const prompt = `${styleDescription} Dish: "${dish.name}" (${dish.category}). Culinary description: ${dish.description}. Key ingredients to showcase: ${dish.ingredients.join(', ')}. Plating details: ${dish.platingNotes}. ${lightingAndBackground} ${angleAndComposition} ${steamText} ${depthText}${customNote} Photorealistic, mouth-watering, highly detailed studio food photo, 8k resolution, commercial culinary magazine cover quality.`;

  return prompt;
}
