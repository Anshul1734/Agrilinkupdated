
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shovel, Sprout, Leaf, Info, Map } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Database entries provided by the user
const terrainData = [
  { id: 1, type: 'Plain', crops: 'Wheat, Corn, Soybeans', practices: 'Use crop rotation and maintain soil pH.' },
  { id: 2, type: 'Hills', crops: 'Tea, Coffee, Fruits', practices: 'Terrace farming to prevent erosion.' },
  { id: 3, type: 'Drylands', crops: 'Millet, Sorghum, Cactus', practices: 'Drought-resistant crops and water harvesting.' },
  { id: 4, type: 'Wetlands', crops: 'Rice, Cranberries, Taro', practices: 'Manage water levels and use raised beds.' },
  { id: 5, type: 'Hills', crops: 'Apples, Potatoes, Herbs', practices: 'Use greenhouses and windbreaks.' },
  { id: 6, type: 'Plain', crops: 'Coconuts, Spinach, Salicornia', practices: 'Salt-tolerant crops and wind protection.' },
  { id: 7, type: 'Hills', crops: 'Mushrooms, Berries, Maple', practices: 'Sustainable harvesting and shade crops.' },
  { id: 8, type: 'Drylands', crops: 'Dates, Agave, Aloe Vera', practices: 'Drip irrigation and sand stabilization.' },
  { id: 9, type: 'Plain', crops: 'Microgreens, Herbs, Tomatoes', practices: 'Vertical farming and hydroponics.' },
  { id: 10, type: 'Drylands', crops: 'Moss, Lichen, Arctic Willow', practices: 'Cold-resistant varieties and minimal disturbance.' },
  { id: 11, type: 'Coastal', crops: 'Coconuts, Spinach, Salicornia', practices: 'Salt-tolerant crops and wind protection' },
  { id: 12, type: 'Wetlands', crops: 'Rice, Cranberries, Taro', practices: 'Raised bed farming for drainage' },
  { id: 13, type: 'Hills', crops: 'Tea, Coffee, Apples', practices: 'Terrace farming and soil conservation' },
  { id: 14, type: 'Plain', crops: 'Wheat, Corn, Soybeans', practices: 'Crop rotation and irrigation management' },
  { id: 15, type: 'Mountainous', crops: 'Potatoes, Barley, Herbs', practices: 'Slope management and erosion control' }
];

// Get unique terrain types
const terrainTypes = [...new Set(terrainData.map(item => item.type))];

interface TerrainInformationProps {
  farmerName?: string;
}

const TerrainInformation: React.FC<TerrainInformationProps> = ({ farmerName = "Farmer" }) => {
  const [selectedTerrain, setSelectedTerrain] = useState<string>("");
  const [recommendations, setRecommendations] = useState<Array<{ id: number; type: string; crops: string; practices: string; }>>([]);
  const [showResults, setShowResults] = useState<boolean>(false);

  const handleTerrainChange = (value: string) => {
    setSelectedTerrain(value);
    setShowResults(false);
  };

  const getCropRecommendations = () => {
    if (!selectedTerrain) return;
    
    const matchingTerrains = terrainData.filter(terrain => 
      terrain.type.toLowerCase() === selectedTerrain.toLowerCase()
    );
    
    setRecommendations(matchingTerrains);
    setShowResults(true);
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-all">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <div className="flex items-center gap-2">
          <Shovel className="h-5 w-5 text-green-600" />
          <CardTitle className="text-xl">Terrain Analysis</CardTitle>
        </div>
        <CardDescription>
          Enter your terrain type to get crop recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="grid gap-2">
            <label htmlFor="terrain-type" className="text-sm font-medium leading-none">
              Your Terrain Type
            </label>
            <Select value={selectedTerrain} onValueChange={handleTerrainChange}>
              <SelectTrigger id="terrain-type" className="w-full">
                <SelectValue placeholder="Select terrain type" />
              </SelectTrigger>
              <SelectContent>
                {terrainTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={getCropRecommendations} 
            disabled={!selectedTerrain}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Sprout className="mr-2 h-4 w-4" />
            Get Crop Recommendations
          </Button>

          {showResults && recommendations.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Map className="h-5 w-5 text-green-600" />
                Recommended Crops for {selectedTerrain} Terrain
              </h3>
              
              {recommendations.map((rec, index) => (
                <div key={index} className="space-y-3">
                  <div className="p-4 rounded-md bg-green-50 dark:bg-green-900/20">
                    <h4 className="font-medium flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-green-600" />
                      Suitable Crops:
                    </h4>
                    <p className="mt-1">{rec.crops}</p>
                  </div>
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Best Farming Practices</AlertTitle>
                    <AlertDescription>
                      {rec.practices}
                    </AlertDescription>
                  </Alert>
                </div>
              ))}
            </div>
          )}
          
          {showResults && recommendations.length === 0 && (
            <Alert className="bg-amber-50 border-amber-200 text-amber-800">
              <Info className="h-4 w-4 text-amber-800" />
              <AlertTitle>No Data Available</AlertTitle>
              <AlertDescription>
                We don't have specific crop recommendations for {selectedTerrain} terrain in our database yet.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 border-t px-6 py-3 text-sm text-muted-foreground">
        Data based on agricultural research specific to your region.
      </CardFooter>
    </Card>
  );
};

export default TerrainInformation;
