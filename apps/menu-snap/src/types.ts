export type StylePreset = 'Rustic/Dark' | 'Bright/Modern' | 'Social Media' | 'Fine Dining' | 'Cozy Cafe';

export type ImageSize = '1K' | '2K' | '4K';

export type AspectRatio = '1:1' | '4:3' | '9:16' | '16:9';

export type SteamOption = 'None' | 'Subtle Steam' | 'Hot Steam & Sizzle' | 'Ice & Condensation';

export type DepthOfField = 'Cinematic Shallow Macro' | 'Balanced' | 'Deep Sharp Focus';

export type SurfaceOption = 'Dark Slate' | 'Carrara Marble' | 'Rustic Wood Table' | 'Sleek Stainless' | 'Textured Concrete';

export interface DishItem {
  id: string;
  name: string;
  category: 'Appetizers' | 'Mains' | 'Desserts' | 'Drinks' | 'Sides' | string;
  description: string;
  ingredients: string[];
  platingNotes: string;
  price?: string;
  tags?: string[];
  selectedStyle?: StylePreset;
  selectedSize?: ImageSize;
  selectedAspectRatio?: AspectRatio;
  customPrompt?: string;
  generatedImageUrl?: string;
  isGenerating?: boolean;
  generationError?: string;
  version?: number;
}

export interface MenuData {
  restaurantName: string;
  cuisine: string;
  description?: string;
  dishes: DishItem[];
}

export interface PhotoShootConfig {
  globalStyle: StylePreset;
  globalSize: ImageSize;
  globalAspectRatio: AspectRatio;
  surface: SurfaceOption;
  depthOfField: DepthOfField;
  steam: SteamOption;
  propLevel: 'Clean Minimal' | 'Chef Prep & Ingredients' | 'Full Table Setting';
}
