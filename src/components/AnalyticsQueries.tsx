
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CirclePlay } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Mock data for query results
const mockQueryResults = {
  "Top 5 Products by Revenue": [
    { product: "Organic Tomatoes", revenue: "$12,500", unitsSold: 5000 },
    { product: "Fresh Apples", revenue: "$9,800", unitsSold: 4200 },
    { product: "Premium Honey", revenue: "$7,600", unitsSold: 950 },
    { product: "Organic Potatoes", revenue: "$6,700", unitsSold: 3400 },
    { product: "Free-range Eggs", revenue: "$5,900", unitsSold: 2900 }
  ],
  "Product Sales Performance": [
    { product: "Organic Tomatoes", totalSold: 5000, totalRevenue: "$12,500" },
    { product: "Fresh Apples", totalSold: 4200, totalRevenue: "$9,800" },
    { product: "Premium Honey", totalSold: 950, totalRevenue: "$7,600" },
    { product: "Organic Potatoes", totalSold: 3400, totalRevenue: "$6,700" },
    { product: "Free-range Eggs", totalSold: 2900, totalRevenue: "$5,900" },
    { product: "Whole Milk", totalSold: 2600, totalRevenue: "$5,200" },
    { product: "Carrots", totalSold: 3100, totalRevenue: "$4,650" },
    { product: "Onions", totalSold: 2800, totalRevenue: "$4,200" },
    { product: "Lettuce", totalSold: 2300, totalRevenue: "$3,910" },
    { product: "Strawberries", totalSold: 1900, totalRevenue: "$3,800" }
  ],
  "Organic Products List": [
    { product: "Organic Tomatoes", category: "Vegetables", price: "$2.50/kg" },
    { product: "Organic Potatoes", category: "Vegetables", price: "$1.75/kg" },
    { product: "Organic Apples", category: "Fruits", price: "$3.20/kg" },
    { product: "Organic Carrots", category: "Vegetables", price: "$1.50/kg" },
    { product: "Organic Milk", category: "Dairy", price: "$4.00/liter" },
    { product: "Organic Eggs", category: "Poultry", price: "$4.50/dozen" },
    { product: "Organic Honey", category: "Sweeteners", price: "$8.00/jar" }
  ],
  "Product Ratings": [
    { product: "Premium Honey", avgRating: 4.9, reviewCount: 120 },
    { product: "Organic Eggs", avgRating: 4.8, reviewCount: 95 },
    { product: "Fresh Apples", avgRating: 4.7, reviewCount: 210 },
    { product: "Organic Tomatoes", avgRating: 4.6, reviewCount: 180 },
    { product: "Whole Milk", avgRating: 4.5, reviewCount: 150 },
    { product: "Organic Potatoes", avgRating: 4.3, reviewCount: 85 },
    { product: "Carrots", avgRating: 4.2, reviewCount: 70 }
  ],
  "Seasonal Products": [
    { product: "Strawberries", season: "Spring", totalQuantity: 4500 },
    { product: "Tomatoes", season: "Summer", totalQuantity: 6200 },
    { product: "Pumpkins", season: "Autumn", totalQuantity: 3800 },
    { product: "Apples", season: "Autumn", totalQuantity: 7500 },
    { product: "Potatoes", season: "Winter", totalQuantity: 5200 },
    { product: "Oranges", season: "Winter", totalQuantity: 4100 }
  ],
  "Best-Selling Categories": [
    { category: "Vegetables", totalOrders: 12500 },
    { category: "Fruits", totalOrders: 9800 },
    { category: "Dairy", totalOrders: 7600 },
    { category: "Grains", totalOrders: 5400 },
    { category: "Poultry", totalOrders: 4800 }
  ],
  "Income vs Expenses": [
    { farmer: "John Smith", totalIncome: "$45,000", totalExpenses: "$18,000" },
    { farmer: "Sarah Johnson", totalIncome: "$38,500", totalExpenses: "$16,200" },
    { farmer: "Robert Williams", totalIncome: "$52,000", totalExpenses: "$22,500" },
    { farmer: "Emily Davis", totalIncome: "$41,200", totalExpenses: "$17,800" }
  ],
  "Monthly Sales Performance": [
    { month: "2025-04", totalOrders: 520, totalSales: "$78,450" },
    { month: "2025-03", totalOrders: 480, totalSales: "$72,300" },
    { month: "2025-02", totalOrders: 410, totalSales: "$63,250" },
    { month: "2025-01", totalOrders: 390, totalSales: "$58,900" },
    { month: "2024-12", totalOrders: 520, totalSales: "$79,800" },
    { month: "2024-11", totalOrders: 380, totalSales: "$61,200" }
  ],
  "High Rated Products": [
    { product: "Premium Honey", avgRating: 4.9, reviewCount: 120 },
    { product: "Organic Eggs", avgRating: 4.8, reviewCount: 95 },
    { product: "Fresh Apples", avgRating: 4.7, reviewCount: 210 },
    { product: "Organic Tomatoes", avgRating: 4.6, reviewCount: 180 },
    { product: "Whole Milk", avgRating: 4.5, reviewCount: 150 },
    { product: "Organic Potatoes", avgRating: 4.3, reviewCount: 85 }
  ],
  "Crop Recommendations": [
    { farmerName: "John Smith", terrain: "Plains", suggestedCrops: "Wheat, Corn, Soybeans", farmingTips: "Use drip irrigation for water efficiency" },
    { farmerName: "Sarah Johnson", terrain: "Hilly", suggestedCrops: "Tea, Coffee, Fruit trees", farmingTips: "Implement terracing to prevent soil erosion" },
    { farmerName: "Robert Williams", terrain: "Wetlands", suggestedCrops: "Rice, Lotus, Water Chestnuts", farmingTips: "Maintain proper water levels throughout growing season" },
    { farmerName: "Emily Davis", terrain: "Sandy", suggestedCrops: "Watermelons, Peanuts, Carrots", farmingTips: "Add organic matter to improve water retention" }
  ],
  "Monthly Financial Summary": [
    { month: "2025-04", recordType: "Income", totalAmount: "$12,500" },
    { month: "2025-04", recordType: "Expense", totalAmount: "$5,200" },
    { month: "2025-03", recordType: "Income", totalAmount: "$11,800" },
    { month: "2025-03", recordType: "Expense", totalAmount: "$4,900" },
    { month: "2025-02", recordType: "Income", totalAmount: "$10,600" },
    { month: "2025-02", recordType: "Expense", totalAmount: "$4,500" }
  ]
};

interface QueryCardProps {
  title: string;
  description: string;
  color: "purple" | "blue";
  onClick: () => void;
}

const QueryCard: React.FC<QueryCardProps> = ({ title, description, color, onClick }) => {
  return (
    <div className={`rounded-lg p-6 ${color === "purple" ? "bg-purple-100" : "bg-blue-100"} transition-all hover:shadow-md cursor-pointer`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`text-lg font-semibold ${color === "purple" ? "text-purple-800" : "text-blue-800"} mb-2`}>{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          className={`rounded-full ${color === "purple" ? "text-purple-800 hover:bg-purple-200" : "text-blue-800 hover:bg-blue-200"}`}
          onClick={onClick}
        >
          <CirclePlay />
        </Button>
      </div>
    </div>
  );
};

interface QueryProps {
  userType: "Farmer" | "Buyer";
}

const AnalyticsQueries: React.FC<QueryProps> = ({ userType }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Define queries based on user type
  const commonQueries = [
    {
      id: 1,
      title: "Top 5 Products by Revenue",
      description: "Shows the top 5 products that generate the most revenue",
      category: "Both",
      color: "purple" as const
    },
    {
      id: 2,
      title: "Product Sales Performance",
      description: "Identify top 10 products by total revenue and units sold",
      category: "Both",
      color: "purple" as const
    },
    {
      id: 8,
      title: "Monthly Sales Performance",
      description: "Show monthly sales performance",
      category: "Both",
      color: "purple" as const
    }
  ];

  const farmerQueries = [
    {
      id: 3,
      title: "Organic Products List",
      description: "List all organic products with their categories",
      category: "Farmer",
      color: "blue" as const
    },
    {
      id: 7,
      title: "Income vs Expenses",
      description: "Calculate income vs expenses for each farmer",
      category: "Farmer",
      color: "purple" as const
    },
    {
      id: 10,
      title: "Crop Recommendations",
      description: "Suitable crops based on farmer's terrain",
      category: "Farmer",
      color: "purple" as const
    },
    {
      id: 11,
      title: "Monthly Financial Summary",
      description: "Financial summary for a specific farmer",
      category: "Farmer",
      color: "purple" as const
    }
  ];

  const buyerQueries = [
    {
      id: 4,
      title: "Product Ratings",
      description: "Get average product ratings with review counts",
      category: "Buyer",
      color: "blue" as const
    },
    {
      id: 5,
      title: "Seasonal Products",
      description: "Find most ordered products by season",
      category: "Buyer",
      color: "blue" as const
    },
    {
      id: 6,
      title: "Best-Selling Categories",
      description: "Identify best-selling product categories",
      category: "Buyer",
      color: "blue" as const
    },
    {
      id: 9,
      title: "High Rated Products",
      description: "Show products with average rating ≥4/5",
      category: "Buyer",
      color: "blue" as const
    }
  ];

  // Filter queries based on user type
  const userQueries = userType === "Farmer" ? farmerQueries : buyerQueries;
  const allQueries = [...commonQueries, ...userQueries];

  // Handle running a query
  const runQuery = (queryTitle: string) => {
    setSelectedQuery(queryTitle);
    setIsRunning(true);
    
    // Simulate query execution with a delay
    setTimeout(() => {
      setQueryResults(mockQueryResults[queryTitle as keyof typeof mockQueryResults] || []);
      setIsRunning(false);
      
      toast({
        title: "Query executed successfully",
        description: `Results for: ${queryTitle}`,
      });
    }, 800);
  };

  // Filter queries based on active tab
  const getFilteredQueries = () => {
    switch (activeTab) {
      case "common":
        return commonQueries;
      case "user":
        return userQueries;
      default:
        return allQueries;
    }
  };

  // Render result table based on query type
  const renderResultTable = () => {
    if (!selectedQuery || queryResults.length === 0) {
      return null;
    }

    // Determine columns based on the query
    const columns = Object.keys(queryResults[0]);

    return (
      <div className="mt-6 bg-white p-4 rounded-lg border">
        <h3 className="font-semibold text-xl mb-4">Results: {selectedQuery}</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.charAt(0).toUpperCase() + column.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {queryResults.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {columns.map((column, colIndex) => (
                    <td key={`${rowIndex}-${colIndex}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row[column]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-agrilink-primary mb-6">Analytics Queries</h2>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="all" className="data-[state=active]:bg-white">All Queries</TabsTrigger>
          <TabsTrigger value="common" className="data-[state=active]:bg-white">Common</TabsTrigger>
          <TabsTrigger value="user" className="data-[state=active]:bg-white">
            For {userType === "Farmer" ? "Farmers" : "Buyers"}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {getFilteredQueries().map((query) => (
          <QueryCard
            key={query.id}
            title={query.title}
            description={query.description}
            color={query.color}
            onClick={() => runQuery(query.title)}
          />
        ))}
      </div>

      {isRunning ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-agrilink-primary"></div>
        </div>
      ) : (
        renderResultTable()
      )}
    </div>
  );
};

export default AnalyticsQueries;
