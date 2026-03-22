import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ShoppingCart, Clock, Package, Search, Star, 
  BarChart4, LogOut, User, Database,
  Tractor, Sun, Cloud, CloudRain, Thermometer, Wind, Shovel, Plus, DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import AnalyticsQueries from "@/components/AnalyticsQueries";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

const mockInventory = [
  {
    id: 1,
    product: "Tomatoes",
    quantity: 250,
    unit: "kg",
    price: 2.50,
    lastUpdated: "2025-04-11",
    status: "In Stock"
  },
  {
    id: 2,
    product: "Apples",
    quantity: 180,
    unit: "kg",
    price: 1.80,
    lastUpdated: "2025-04-10",
    status: "In Stock"
  },
  {
    id: 3,
    product: "Honey",
    quantity: 50,
    unit: "jars",
    price: 8.00,
    lastUpdated: "2025-04-09",
    status: "Low Stock"
  },
  {
    id: 4,
    product: "Milk",
    quantity: 75,
    unit: "liters",
    price: 2.20,
    lastUpdated: "2025-04-12",
    status: "In Stock"
  },
  {
    id: 5,
    product: "Eggs",
    quantity: 120,
    unit: "dozen",
    price: 3.50,
    lastUpdated: "2025-04-12",
    status: "In Stock"
  },
  {
    id: 6,
    product: "Potatoes",
    quantity: 15,
    unit: "kg",
    price: 1.50,
    lastUpdated: "2025-04-10",
    status: "Low Stock"
  },
];

const mockOrders = [
  {
    id: 1,
    buyer: "John Smith",
    product: "Tomatoes",
    quantity: 20,
    amount: 50.00,
    date: "2025-04-12",
    status: "Pending"
  },
  {
    id: 2,
    buyer: "Emily Davis",
    product: "Apples",
    quantity: 15,
    amount: 27.00,
    date: "2025-04-11",
    status: "Shipped"
  },
  {
    id: 3,
    buyer: "Michael Wilson",
    product: "Honey",
    quantity: 5,
    amount: 40.00,
    date: "2025-04-10",
    status: "Delivered"
  },
  {
    id: 4,
    buyer: "Sarah Johnson",
    product: "Milk",
    quantity: 10,
    amount: 22.00,
    date: "2025-04-09",
    status: "Delivered"
  }
];

const mockWeatherForecast = [
  { day: "Today", temperature: "24°C", condition: "Sunny", icon: Sun },
  { day: "Tomorrow", temperature: "22°C", condition: "Partly Cloudy", icon: Cloud },
  { day: "Wednesday", temperature: "20°C", condition: "Rain", icon: CloudRain },
  { day: "Thursday", temperature: "19°C", condition: "Rain", icon: CloudRain },
  { day: "Friday", temperature: "21°C", condition: "Partly Cloudy", icon: Cloud }
];

const mockMonthlySales = [
  { month: 'Jan', sales: 4200, target: 4000 },
  { month: 'Feb', sales: 4800, target: 4000 },
  { month: 'Mar', sales: 5100, target: 5000 },
  { month: 'Apr', sales: 4900, target: 5000 },
  { month: 'May', sales: 5500, target: 5000 },
  { month: 'Jun', sales: 5900, target: 6000 },
  { month: 'Jul', sales: 6200, target: 6000 },
  { month: 'Aug', sales: 5800, target: 6000 },
  { month: 'Sep', sales: 6100, target: 6500 },
  { month: 'Oct', sales: 6700, target: 6500 },
  { month: 'Nov', sales: 7200, target: 7000 },
  { month: 'Dec', sales: 7800, target: 7000 }
];

const mockTopProducts = [
  { name: 'Tomatoes', revenue: 5820, units: 2328 },
  { name: 'Apples', revenue: 4500, units: 2500 },
  { name: 'Honey', revenue: 3800, units: 475 },
  { name: 'Potatoes', revenue: 3600, units: 2400 },
  { name: 'Eggs', revenue: 3200, units: 914 },
  { name: 'Milk', revenue: 2900, units: 1318 },
  { name: 'Lettuce', revenue: 2500, units: 1250 },
  { name: 'Carrots', revenue: 2100, units: 1400 },
  { name: 'Strawberries', revenue: 1950, units: 650 },
  { name: 'Spinach', revenue: 1750, units: 875 }
];

const mockFinancials = [
  { month: 'Jan', income: 4200, expenses: 2800 },
  { month: 'Feb', income: 4800, expenses: 2700 },
  { month: 'Mar', income: 5100, expenses: 3100 },
  { month: 'Apr', income: 4900, expenses: 3200 },
  { month: 'May', income: 5500, expenses: 3400 },
  { month: 'Jun', income: 5900, expenses: 3600 },
  { month: 'Jul', income: 6200, expenses: 3700 },
  { month: 'Aug', income: 5800, expenses: 3500 },
  { month: 'Sep', income: 6100, expenses: 3800 },
  { month: 'Oct', income: 6700, expenses: 4000 },
  { month: 'Nov', income: 7200, expenses: 4200 },
  { month: 'Dec', income: 7800, expenses: 4500 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const FarmerDashboard: React.FC = () => {
  const { user, isAuthenticated, userType, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [salesReportOpen, setSalesReportOpen] = useState(false);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newQuantity, setNewQuantity] = useState("");
  const [recentOrders, setRecentOrders] = useState(mockOrders);

  const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['farmer_inventory', user?.id],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/products?sellerId=${user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch inventory');
      return res.json();
    },
    enabled: !!user?.id
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const totalProducts = inventory.length;
  const totalQuantity = inventory.reduce((acc: number, item: any) => acc + (item.quantityAvailable !== undefined ? item.quantityAvailable : item.quantity || 0), 0);
  const lowStockItems = inventory.filter((item: any) => (item.quantityAvailable !== undefined ? item.quantityAvailable : item.quantity || 0) <= 20).length;

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out from your account"
    });
    navigate('/');
  };

  const handleAddProduct = () => {
    setIsAddingProduct(true);
  };

  const addProductMutation = useMutation({
    mutationFn: async (newProduct: any) => {
      const res = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add product');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmer_inventory'] });
      setIsAddingProduct(false);
      toast({ title: "Product Added", description: "Your product has been added successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error Adding Product", description: err.message, variant: "destructive" });
    }
  });

  const handleSaveProduct = () => {
    let catVal = (document.getElementById("category") as HTMLSelectElement)?.value || "1";
    if (catVal === "vegetables") catVal = "1";
    if (catVal === "fruits") catVal = "2";
    if (catVal === "dairy") catVal = "3";
    if (catVal === "grains") catVal = "4";

    const newProduct = {
      name: (document.getElementById("product-name") as HTMLInputElement)?.value || "New Product",
      quantityAvailable: parseInt((document.getElementById("quantity") as HTMLInputElement)?.value || "0"),
      unit: "kg",
      price: parseFloat((document.getElementById("price") as HTMLInputElement)?.value || "0"),
      sellerId: parseInt(user?.id?.toString() || "1"),
      sellerName: user?.name || "Farmer",
      categoryId: parseInt(catVal) || 1,
      categoryName: (document.getElementById("category") as HTMLSelectElement)?.selectedOptions[0]?.text || "Vegetables",
      description: (document.getElementById("description") as HTMLTextAreaElement)?.value || "",
      productionType: "Traditional"
    };
    addProductMutation.mutate(newProduct);
  };

  const handleUpdateStock = (product: any) => {
    setSelectedProduct(product);
    setNewQuantity((product.quantityAvailable !== undefined ? product.quantityAvailable : product.quantity).toString());
    setIsUpdatingStock(true);
  };

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, quantityAvailable }: { id: number, quantityAvailable: number }) => {
      const res = await fetch(`http://localhost:5000/api/products/${id}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantityAvailable, inStock: quantityAvailable > 0 }),
      });
      if (!res.ok) throw new Error('Failed to update stock');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmer_inventory'] });
      setIsUpdatingStock(false);
      toast({ title: "Stock Updated", description: "Stock has been updated successfully." });
    }
  });

  const handleSaveStockUpdate = () => {
    if (selectedProduct) {
      if (selectedProduct.created_at) { // real DB
        updateStockMutation.mutate({ id: selectedProduct.id, quantityAvailable: parseInt(newQuantity) });
      } else { // fallback for mock
        setIsUpdatingStock(false);
        toast({ title: "Mock Stock Updated", description: "Moved to real API logic." });
      }
    }
  };

  const handleViewAllProducts = () => {
    navigate("/products");
  };

  const handleViewAllOrders = () => {
    navigate("/orders");
  };

  const handleViewReviews = () => {
    navigate("/my-reviews");
  };

  const totalRevenue = mockMonthlySales.reduce((acc, month) => acc + month.sales, 0);
  const totalExpenses = mockFinancials.reduce((acc, month) => acc + month.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;
  
  const currentMonth = new Date().getMonth();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthData = mockMonthlySales.find(item => item.month === monthNames[currentMonth]) || { sales: 0, target: 0 };
  const currentMonthExpenses = mockFinancials.find(item => item.month === monthNames[currentMonth])?.expenses || 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <Tractor className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-agrilink-primary">Farmer Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user?.name || "Farmer"}</p>
            </div>
          </div>
          <Button className="bg-agrilink-primary hover:bg-agrilink-secondary" onClick={handleAddProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Product
          </Button>
        </div>

        <div className="mb-8">
          <Button 
            variant="analytics" 
            size="lg" 
            className="w-full" 
            onClick={() => setAnalyticsDialogOpen(true)}
          >
            <Database className="mr-2" /> Open Analytics Queries
          </Button>
        </div>
        
        <div className="mb-8">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <CloudRain className="h-5 w-5 mr-2" />
                Weather Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 justify-between">
                {mockWeatherForecast.map((day, index) => (
                  <div key={index} className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">{day.day}</p>
                    <day.icon className="h-8 w-8 my-2 text-blue-500" />
                    <p className="text-lg font-bold">{day.temperature}</p>
                    <p className="text-sm text-muted-foreground">{day.condition}</p>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t px-6 py-3">
              <p className="text-sm text-muted-foreground">
                Data updated: April 13, 2025
              </p>
            </CardFooter>
          </Card>
        </div>
        
        {user?.terrain && (
          <div className="mb-8">
            <Card className="shadow-sm hover:shadow-md transition-all">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <CardTitle className="text-xl flex items-center">
                  <Shovel className="h-5 w-5 text-green-600 mr-2" />
                  Recommended Crops for {user.terrain} Terrain
                </CardTitle>
                <CardDescription>
                  Based on your terrain information
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {user.recommendedCrops ? (
                  <div className="p-4 rounded-md bg-green-50">
                    <h4 className="font-medium flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-600" />
                      Suitable Crops:
                    </h4>
                    <p className="mt-1">{user.recommendedCrops}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No crop recommendations available for your terrain.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-muted-foreground mb-2">Total Products</p>
                  <h2 className="text-4xl font-bold">{totalProducts}</h2>
                  <p className="text-sm text-green-600 mt-1">All products</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-muted-foreground mb-2">Total Inventory</p>
                  <h2 className="text-4xl font-bold">{totalQuantity}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Units in stock</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-muted-foreground mb-2">Low Stock Items</p>
                  <h2 className="text-4xl font-bold">{lowStockItems}</h2>
                  <p className="text-sm text-amber-600 mt-1">Needs attention</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    className="bg-agrilink-primary hover:bg-agrilink-secondary h-auto py-4 flex flex-col items-center justify-center gap-2 text-center" 
                    onClick={handleAddProduct}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span>Add Product</span>
                  </Button>
                  
                  <Button 
                    className="bg-agrilink-primary hover:bg-agrilink-secondary h-auto py-4 flex flex-col items-center justify-center gap-2 text-center"
                    onClick={() => handleUpdateStock(inventory[0])}
                  >
                    <Package className="h-5 w-5" />
                    <span>Update Stock</span>
                  </Button>
                  
                  <Button 
                    className="bg-agrilink-primary hover:bg-agrilink-secondary h-auto py-4 flex flex-col items-center justify-center gap-2 text-center" 
                    onClick={handleViewReviews}
                  >
                    <Star className="h-5 w-5" />
                    <span>View Reviews</span>
                  </Button>

                  <Button 
                    className="bg-agrilink-primary hover:bg-agrilink-secondary h-auto py-4 flex flex-col items-center justify-center gap-2 text-center" 
                    onClick={() => setSalesReportOpen(true)}
                  >
                    <BarChart4 className="h-5 w-5" />
                    <span>Sales Report</span>
                  </Button>

                  <Button 
                    className="bg-agrilink-primary hover:bg-agrilink-secondary h-auto py-4 flex flex-col items-center justify-center gap-2 text-center" 
                    onClick={() => setAnalyticsDialogOpen(true)}
                  >
                    <Database className="h-5 w-5" />
                    <span>Analytics</span>
                  </Button>

                  <Button 
                    className="bg-red-500 hover:bg-red-600 h-auto py-4 flex flex-col items-center justify-center gap-2 text-center"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6">
              <Card className="bg-gradient-to-br from-agrilink-primary to-agrilink-secondary text-white shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">AgriLink Pro</h3>
                  <p className="text-sm opacity-90 mb-4">Get premium access to exclusive farming tools and analytics</p>
                  <Button variant="outline" className="text-white border-white hover:bg-white hover:text-agrilink-primary w-full" onClick={() => toast({ title: "AgriLink Pro", description: "Premium accounts coming soon!" })}>
                    Upgrade Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Inventory Management</h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryLoading ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-8">Loading inventory from database...</TableCell></TableRow>
                      ) : inventory.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name || item.product}</TableCell>
                          <TableCell>{item.quantityAvailable !== undefined ? item.quantityAvailable : item.quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>${(item.price || 0).toFixed(2)}</TableCell>
                          <TableCell>{item.created_at ? new Date(item.created_at).toLocaleDateString() : item.lastUpdated}</TableCell>
                          <TableCell>
                            <span 
                              className={`px-2 py-1 rounded-full text-xs ${
                                (item.quantityAvailable !== undefined ? item.quantityAvailable : item.quantity) > 20 
                                  ? "bg-green-100 text-green-600" 
                                  : "bg-yellow-100 text-yellow-600"
                              }`}
                            >
                              {(item.quantityAvailable !== undefined ? item.quantityAvailable : item.quantity) > 20 ? "In Stock" : "Low Stock"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleUpdateStock(item)}
                              className="text-xs"
                            >
                              Update
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="px-6 py-3 bg-gray-50 border-t">
                <div className="flex justify-between items-center w-full">
                  <span className="text-sm text-muted-foreground">Showing {inventory.length} products</span>
                  <Button variant="outline" size="sm" onClick={handleViewAllProducts}>View All Products</Button>
                </div>
              </CardFooter>
            </Card>
            
            <div className="mt-6">
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Recent Orders</h2>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Buyer</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id}</TableCell>
                            <TableCell>{order.buyer}</TableCell>
                            <TableCell>{order.product}</TableCell>
                            <TableCell>{order.quantity}</TableCell>
                            <TableCell>${order.amount.toFixed(2)}</TableCell>
                            <TableCell>{order.date}</TableCell>
                            <TableCell>
                              <span 
                                className={`px-2 py-1 rounded-full text-xs ${
                                  order.status === "Delivered" 
                                    ? "bg-green-100 text-green-600" 
                                    : order.status === "Shipped"
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-yellow-100 text-yellow-600"
                                }`}
                              >
                                {order.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                <CardFooter className="px-6 py-3 bg-gray-50 border-t">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-sm text-muted-foreground">Showing {recentOrders.length} orders</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleViewAllOrders}
                    >
                      View All Orders
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>

        <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>Fill in the details to list a new product.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="product-name" className="text-right">Product Name</label>
                <input
                  id="product-name"
                  className="col-span-3 px-2 py-1 border rounded"
                  placeholder="Enter product name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="category" className="text-right">Category</label>
                <select id="category" className="col-span-3 px-2 py-1 border rounded">
                  <option value="">Select a category</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="fruits">Fruits</option>
                  <option value="dairy">Dairy</option>
                  <option value="grains">Grains</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="price" className="text-right">Price</label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  className="col-span-3 px-2 py-1 border rounded"
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="quantity" className="text-right">Quantity</label>
                <input
                  id="quantity"
                  type="number"
                  className="col-span-3 px-2 py-1 border rounded"
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="description" className="text-right">Description</label>
                <textarea
                  id="description"
                  className="col-span-3 px-2 py-1 border rounded"
                  rows={3}
                  placeholder="Enter product description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingProduct(false)}>Cancel</Button>
              <Button onClick={handleSaveProduct}>Add Product</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isUpdatingStock} onOpenChange={setIsUpdatingStock}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Stock</DialogTitle>
              <DialogDescription>
                Update the stock quantity for {selectedProduct?.product}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="current-quantity" className="text-right">Current Quantity</label>
                <input
                  id="current-quantity"
                  className="col-span-3 px-2 py-1 border rounded bg-gray-50"
                  value={selectedProduct?.quantity}
                  disabled
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="new-quantity" className="text-right">New Quantity</label>
                <input
                  id="new-quantity"
                  type="number"
                  className="col-span-3 px-2 py-1 border rounded"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUpdatingStock(false)}>Cancel</Button>
              <Button onClick={handleSaveStockUpdate}>Update Stock</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={analyticsDialogOpen} onOpenChange={setAnalyticsDialogOpen}>
          <DialogContent className="max-w-[90vw] max-h-[80vh] w-[1000px] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Analytics Dashboard</DialogTitle>
              <DialogDescription>
                Run analytics queries to gain insights into your farm's performance
              </DialogDescription>
            </DialogHeader>
            <AnalyticsQueries userType="Farmer" />
          </DialogContent>
        </Dialog>

        <Dialog open={salesReportOpen} onOpenChange={setSalesReportOpen}>
          <DialogContent className="max-w-[90vw] max-h-[80vh] w-[1000px] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart4 className="h-5 w-5 text-agrilink-primary" />
                Sales Performance Report
              </DialogTitle>
              <DialogDescription>
                Detailed view of your sales performance, top products, and financial overview
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Monthly Sales Performance</h3>
                <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-md">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Total Revenue</h4>
                    <p className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Total Expenses</h4>
                    <p className="text-2xl font-bold text-red-500">${totalExpenses.toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Total Profit</h4>
                    <p className="text-2xl font-bold text-blue-600">${totalProfit.toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Profit Margin</h4>
                    <p className="text-2xl font-bold text-purple-600">{((totalProfit / totalRevenue) * 100).toFixed(1)}%</p>
                  </div>
                </div>

                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { name: 'Jan', value: 400 },
                        { name: 'Feb', value: 300 },
                        { name: 'Mar', value: 600 },
                        { name: 'Apr', value: 800 },
                        { name: 'May', value: 500 },
                        { name: 'Jun', value: 700 }
                      ]}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default FarmerDashboard;
