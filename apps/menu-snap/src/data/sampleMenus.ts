import { MenuData } from '../types';

export const SAMPLE_MENUS: MenuData[] = [
  {
    restaurantName: 'Osteria Del Sole',
    cuisine: 'Authentic Italian Trattoria',
    description: 'Rustic Tuscan flavors with handcrafted pastas and wood-fired artisanal dishes.',
    dishes: [
      {
        id: 'osteria-1',
        name: 'Burrata Pugliese Crostini',
        category: 'Appetizers',
        description: 'Creamy artisanal burrata cheese over charred sourdough, topped with heirloom cherry tomatoes, basil pesto, and aged balsamic glaze.',
        ingredients: ['Fresh Burrata Cheese', 'Charred Sourdough', 'Heirloom Tomatoes', 'Genovese Basil Pesto', 'Aged Modenese Balsamic'],
        platingNotes: 'Served on a rustic speckled ceramic plate, garnished with fresh basil leaves and a drizzle of extra virgin olive oil.',
        price: '$18.50',
        tags: ['Vegetarian', 'Chef Special']
      },
      {
        id: 'osteria-2',
        name: 'Truffle Tagliolini al Burro',
        category: 'Mains',
        description: 'Hand-rolled egg tagliolini tossed in rich cultured Normandy butter, Parmigiano-Reggiano, and freshly shaved black Norcia truffle.',
        ingredients: ['Egg Tagliolini Pasta', 'Normandy Butter', 'Parmigiano-Reggiano 36-Month', 'Black Summer Truffle'],
        platingNotes: 'Twirled neatly into a high mound on a shallow dark ceramic pasta bowl, generously topped with paper-thin black truffle shavings.',
        price: '$32.00',
        tags: ['Signature', 'House Made']
      },
      {
        id: 'osteria-3',
        name: 'Bistecca alla Fiorentina',
        category: 'Mains',
        description: 'Dry-aged T-bone steak grilled over oak charcoal, finished with coarse Maldon sea salt flakes and rosemary infused olive oil.',
        ingredients: ['Dry-Aged Chianina Beef', 'Maldon Sea Salt', 'Fresh Rosemary', 'Extra Virgin Olive Oil'],
        platingNotes: 'Sliced on an authentic charred oak cutting board with roasted garlic cloves and fresh rosemary sprigs on the side.',
        price: '$68.00',
        tags: ['Prime Cut', 'Gluten-Free']
      },
      {
        id: 'osteria-4',
        name: 'Classic Espresso Tiramisu',
        category: 'Desserts',
        description: 'Traditional savoiardi ladyfingers soaked in single-origin dark espresso and dark rum, layered with silky mascarpone cream and Valrhona cocoa powder.',
        ingredients: ['Savoiardi Ladyfingers', 'Espresso', 'Mascarpone', 'Dark Cocoa Powder', 'Dark Rum'],
        platingNotes: 'Served in a elegant crystal glassware cup, dusted with dark cocoa with a roasted espresso bean on top.',
        price: '$14.00',
        tags: ['Classic', 'Popular']
      }
    ]
  },
  {
    restaurantName: 'Sakura Izakaya',
    cuisine: 'Modern Japanese & Sushi Bar',
    description: 'Precision Japanese dining featuring flame-seared nigiri, rich tonkotsu ramen, and craft matcha treats.',
    dishes: [
      {
        id: 'sakura-1',
        name: 'Aburi Salmon & Truffle Nigiri',
        category: 'Appetizers',
        description: 'Torch-seared fatty salmon belly over seasoned sushi rice, topped with black truffle paste, ikura salmon caviar, and gold leaf.',
        ingredients: ['Scottish Salmon Belly', 'Sushi Rice', 'Black Truffle Tapenade', 'Ikura Caviar', 'Edible Gold Leaf'],
        platingNotes: 'Arranged precisely on a matte black slate rectangle with pickled ginger and fresh wasabi mound.',
        price: '$24.00',
        tags: ['Raw/Seared', 'Luxury']
      },
      {
        id: 'sakura-2',
        name: 'Rich Tonkotsu Black Garlic Ramen',
        category: 'Mains',
        description: 'Slow-simmered 18-hour pork bone broth enriched with roasted black garlic oil, tender chashu pork belly, ajitama nitamago soft egg, and wood ear mushrooms.',
        ingredients: ['Pork Bone Broth', 'Black Garlic Mayu', 'Chashu Pork Belly', 'Ramen Noodles', 'Soft-Boiled Ajitama Egg', 'Nori Seaweed'],
        platingNotes: 'Served in a textured dark Japanese ceramic bowl with bamboo chopsticks resting across the rim and visible steam.',
        price: '$21.00',
        tags: ['Comfort Food', 'Best Seller']
      },
      {
        id: 'sakura-3',
        name: 'Matcha Green Tea Parfait',
        category: 'Desserts',
        description: 'Uji matcha gelato layered with azuki sweet red bean paste, chewy shiratama dango mochi, and crispy matcha wafer biscuit.',
        ingredients: ['Uji Matcha Gelato', 'Sweet Azuki Red Beans', 'Shiratama Mochi', 'Matcha Wafer'],
        platingNotes: 'Layered tall in a clear glass vessel, drizzled with green tea syrup and toasted sesame seeds.',
        price: '$13.50',
        tags: ['Vegetarian', 'Authentic']
      }
    ]
  },
  {
    restaurantName: 'Smash & Smoke Craft Burgers',
    cuisine: 'Artisanal Burger Joint & Brewpub',
    description: 'Juicy double-smash burgers with crispy lacework edges, loaded fries, and decadent thick shakes.',
    dishes: [
      {
        id: 'burger-1',
        name: 'The Ultimate Truffle Smash Burger',
        category: 'Mains',
        description: 'Double Angus beef smash patties with crispy caramelized lace edges, melted aged cheddar, smoked bacon jam, and black truffle aioli on a toasted brioche bun.',
        ingredients: ['Angus Beef Patties', 'Aged Cheddar Cheese', 'Smoked Bacon Jam', 'Black Truffle Aioli', 'Brioche Bun'],
        platingNotes: 'Gently cut in half showing the juicy melted cheese drip and thick smash layers, served on butcher parchment paper.',
        price: '$19.00',
        tags: ['Top Pick', 'Juicy']
      },
      {
        id: 'burger-2',
        name: 'Loaded Brisket & Cheese Waffle Fries',
        category: 'Sides',
        description: 'Crispy waffle-cut potatoes topped with 12-hour smoked beef brisket, warm beer cheese sauce, pickled jalapeños, and green onions.',
        ingredients: ['Waffle Cut Fries', 'Smoked Beef Brisket', 'Craft Beer Cheese', 'Pickled Jalapeños', 'Chives'],
        platingNotes: 'Piled high in a cast iron skillet with melted cheese strings stretching.',
        price: '$15.00',
        tags: ['Shareable', 'Spicy']
      },
      {
        id: 'burger-3',
        name: 'Salted Caramel Pretzel Shake',
        category: 'Drinks',
        description: 'Thick Madagascar vanilla bean milkshake blended with house salted caramel, topped with whipped cream, crushed pretzels, and a whole pretzel on the rim.',
        ingredients: ['Vanilla Bean Ice Cream', 'Salted Caramel Drizzle', 'Crushed Salty Pretzels', 'Whipped Cream'],
        platingNotes: 'Served in a frosted mason glass with caramel cascading down the inner glass sides.',
        price: '$9.50',
        tags: ['Decadent', 'Sweet']
      }
    ]
  },
  {
    restaurantName: 'Flora & Leaf Vegan Bistro',
    cuisine: 'Organic Plant-Based Cafe',
    description: 'Vibrant, colorful organic dishes using superfoods, edible blossoms, and cold-pressed juices.',
    dishes: [
      {
        id: 'flora-1',
        name: 'Avocado Blossom Sourdough Toast',
        category: 'Appetizers',
        description: 'Thick artisan sourdough toasted, smeared with citrus hemp ricotta, layered with a delicate avocado rose, microgreens, radish coins, and chia seeds.',
        ingredients: ['Artisan Sourdough', 'Hemp Seed Ricotta', 'Hass Avocado', 'Micro Edible Flowers', 'Watermelon Radish'],
        platingNotes: 'Presented on a bright white ceramic plate with vibrant green microgreens scattered on a clean Scandinavian wood table.',
        price: '$16.00',
        tags: ['100% Vegan', 'Gluten-Free Option']
      },
      {
        id: 'flora-2',
        name: 'Dragonfruit Acai Superfood Bowl',
        category: 'Desserts',
        description: 'Frozen pink pitaya and organic acai blend topped with fan-sliced mango, blueberries, coconut flakes, chia seed pudding, and house granola.',
        ingredients: ['Organic Acai', 'Pink Pitaya Dragonfruit', 'Fresh Mango', 'Blueberries', 'Toasted Coconut Flakes', 'Granola'],
        platingNotes: 'Arranged in a coconut shell bowl with clean geometric fruit lines and colorful contrast.',
        price: '$14.50',
        tags: ['Antioxidant Rich', 'Raw']
      }
    ]
  }
];
