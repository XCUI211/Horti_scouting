// Mapping of pest names in the database with the correct display names
export const PEST_NAMES = {red_spider_mite: "Red spider mite",
                                thrips: "Thrips",
                                green_louse: "Green louse",
                                black_louse: "Black louse",
                                mealybug: "Mealybug",
                                pythium: "Pythium",
                                mite: "Mite",
                                cycada: "Cycada",
                                weed: "Weed",
                                caterpillar: "Caterpillar"};

// Colour mapping based on what the client provided
export const PEST_COLORS = {red_spider_mite: "#E53935",  // Red
                                 thrips: "#7E57C2",           // Purple
                                 caterpillar: "#FFD54F",      // Yellow
                                 green_louse: "#43A047",      // Green
                                 black_louse: "#1E88E5",      // Blue
                                 mealybug: "#BDBDBD",         // Gray
                                 pythium: "#212121",          // Black
                                 mite: "#F57C00",             // Orange
                                 cycada: "#AED581",           // Light yellow-green
                                 weed: "#81C784"};            // Light green

// Converts singular pest name to the correct display name
export const formatPestName = (internalName) => {
    return PEST_NAMES[internalName] || internalName};

// Converts array of pest names to the correct display names
export const formatPestNames = (pestArray) => {
    if (!Array.isArray(pestArray)) return [];
    return pestArray.map(formatPestName)};

// Retrieves colour for the corresponding pest
export const getPestColor = (internalName) => {
    return PEST_COLORS[internalName] || "#999999"};
