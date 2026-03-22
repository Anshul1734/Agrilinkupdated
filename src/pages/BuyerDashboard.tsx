import React, { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { 
  ShoppingCart, Clock, Package, Search, Star, HelpCircle, 
  BarChart4, TrendingUp, FileText, Bell, LogOut, User, Database, Loader2
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import AnalyticsQueries from "@/components/AnalyticsQueries";



const BuyerDashboard: React.FC = () => {
  const { user, isAuthenticated, userType, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  const { data: realOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['buyer_orders', user?.id],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/orders?buyerId=${user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    enabled: !!user?.id
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const totalOrders = realOrders.length;
  const processingOrders = realOrders.filter((o: any) => o.status === "Processing" || o.status === "Pending").length;
  const deliveredOrders = realOrders.filter((o: any) => o.status === "Delivered").length;
  
  // Toast notification handlers
  const handleHelp = () => {
    toast({
      title: "Help Center",
      description: "Our support team will contact you shortly."
    });
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out from your account"
    });
    navigate('/');
  };

  const handleMarketplaceClick = () => {
    toast({
      title: "Marketplace",
      description: "Redirecting to marketplace..."
    });
  };

  const handleFindProductsClick = () => {
    setShowSearch(true);
    toast({
      title: "Find Products",
      description: "Search feature activated"
    });
  };
  
  const handleReviewsClick = () => {
    navigate('/my-reviews');
    toast({
      title: "My Reviews",
      description: "Loading your product reviews"
    });
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-agrilink-primary">Buyer Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user?.name}</p>
            </div>
          </div>
          <Button className="bg-agrilink-primary hover:bg-agrilink-secondary" asChild>
            <Link to="/products" onClick={handleMarketplaceClick}>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Browse Marketplace
            </Link>
          </Button>
        </div>

        {/* Analytics Button */}
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
        
        {/* Product Search Section */}
        {showSearch && (
          <div className="mb-8">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Find Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search for products by name, category or farmer..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agrilink-primary"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button 
                      variant="agrilink" 
                      onClick={() => {
                        if (searchQuery.trim()) {
                          toast({
                            title: "Searching Products",
                            description: `Looking for "${searchQuery}"...`
                          });
                          navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
                        }
                      }}
                    >
                      <Search className="h-5 w-5 mr-2" /> Search
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery("Organic")}>Organic</Button>
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery("Vegetables")}>Vegetables</Button>
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery("Fruits")}>Fruits</Button>
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery("Dairy")}>Dairy</Button>
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery("Local")}>Local</Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t px-6 py-3">
                <Button variant="ghost" size="sm" onClick={() => setShowSearch(false)}>
                  Hide Search
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-muted-foreground mb-2">Total Orders</p>
                  <h2 className="text-4xl font-bold">{totalOrders}</h2>
                  <p className="text-sm text-green-600 mt-1">+2 this month</p>
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
                  <p className="text-muted-foreground mb-2">Order Processing</p>
                  <h2 className="text-4xl font-bold">{processingOrders}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Awaiting delivery</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-muted-foreground mb-2">Delivered Orders</p>
                  <h2 className="text-4xl font-bold">{deliveredOrders}</h2>
                  <p className="text-sm text-muted-foreground mt-1">All completed</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    className="bg-agrilink-primary hover:bg-agrilink-secondary h-auto py-4 flex flex-col items-center justify-center gap-2 text-center" 
                    onClick={() => {
                      handleMarketplaceClick();
                      navigate('/products');
                    }}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span>Marketplace</span>
                  </Button>
                  
                  <Button 
                    className="bg-agrilink-primary hover:bg-agrilink-secondary h-auto py-4 flex flex-col items-center justify-center gap-2 text-center" 
                    onClick={handleFindProductsClick}
                  >
                    <Search className="h-5 w-5" />
                    <span>Find Products</span>
                  </Button>
                  
                  <Button 
                    className="bg-agrilink-primary hover:bg-agrilink-secondary h-auto py-4 flex flex-col items-center justify-center gap-2 text-center" 
                    onClick={() => navigate('/products')}
                  >
                    <TrendingUp className="h-5 w-5" />
                    <span>Explore Fresh</span>
                  </Button>

                  <Button 
                    className="bg-agrilink-primary hover:bg-agrilink-secondary h-auto py-4 flex flex-col items-center justify-center gap-2 text-center" 
                    onClick={() => navigate('/categories')}
                  >
                    <Star className="h-5 w-5" />
                    <span>Browse Categories</span>
                  </Button>
                  
                  <Button 
                    className="bg-red-500 hover:bg-red-600 h-auto py-4 flex flex-col items-center justify-center gap-2 text-center"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2 text-center border-agrilink-primary/30 text-agrilink-primary hover:bg-agrilink-primary/10"
                    onClick={handleHelp}
                  >
                    <HelpCircle className="h-5 w-5" />
                    <span>Get Help</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6">
              <Card className="bg-gradient-to-br from-agrilink-primary to-agrilink-secondary text-white shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">AgriLink Pro</h3>
                  <p className="text-sm opacity-90 mb-4">Get premium access to exclusive farming deals and insights</p>
                  <Button variant="outline" className="text-white border-white hover:bg-white hover:text-agrilink-primary w-full" onClick={() => toast({ title: "AgriLink Pro", description: "Premium accounts coming soon!" })}>
                    Upgrade Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Order History */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Order History</h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordersLoading ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-agrilink-primary" /></TableCell></TableRow>
                      ) : realOrders.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-8">No orders found.</TableCell></TableRow>
                      ) : realOrders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>{order.product || "Marketplace Products"}</TableCell>
                          <TableCell>{order.quantity || "-"}</TableCell>
                          <TableCell>{order.seller || order.sellerName || "AgriLink Farmers"}</TableCell>
                          <TableCell>${(order.amount || order.totalAmount || 0).toFixed(2)}</TableCell>
                          <TableCell>{order.date || (order.created_at ? new Date(order.created_at).toLocaleDateString() : "")}</TableCell>
                          <TableCell>
                            <span 
                              className={`px-2 py-1 rounded-full text-xs ${
                                order.status === "Delivered" 
                                  ? "bg-green-100 text-green-600" 
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
                  <span className="text-sm text-muted-foreground">Showing {realOrders.length} orders</span>
                  <Button variant="outline" size="sm">View All Orders</Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>



        {/* Analytics Dialog */}
        <Dialog open={analyticsDialogOpen} onOpenChange={setAnalyticsDialogOpen}>
          <DialogContent className="max-w-[90vw] max-h-[80vh] w-[1000px] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Analytics Dashboard</DialogTitle>
              <DialogDescription>
                Run analytics queries to gain insights into product performance
              </DialogDescription>
            </DialogHeader>
            <AnalyticsQueries userType="Buyer" />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default BuyerDashboard;
