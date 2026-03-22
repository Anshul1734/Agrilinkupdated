
import React, { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Package, Clock, Check, AlertCircle, Search, Filter, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// Mock orders for demonstration
const mockFarmerOrders = [
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
  },
  {
    id: 5,
    buyer: "Robert Brown",
    product: "Carrots",
    quantity: 30,
    amount: 45.00,
    date: "2025-04-08",
    status: "Cancelled"
  },
  {
    id: 6,
    buyer: "Jessica Miller",
    product: "Potatoes",
    quantity: 25,
    amount: 37.50,
    date: "2025-04-07",
    status: "Delivered"
  },
  {
    id: 7,
    buyer: "David Wilson",
    product: "Eggs",
    quantity: 40,
    amount: 160.00,
    date: "2025-04-06",
    status: "Shipped"
  },
  {
    id: 8,
    buyer: "Margaret Taylor",
    product: "Cheese",
    quantity: 3,
    amount: 18.00,
    date: "2025-04-05",
    status: "Delivered"
  }
];

const mockBuyerOrders = [
  {
    id: 15,
    product: "Tomatoes",
    quantity: 5,
    seller: "John Doe",
    amount: 7.50,
    date: "2025-04-05",
    status: "Delivered"
  },
  {
    id: 14,
    product: "Apples",
    quantity: 10,
    seller: "Alice Johnson",
    amount: 20.00,
    date: "2025-04-01",
    status: "Delivered"
  },
  {
    id: 13,
    product: "Honey",
    quantity: 2,
    seller: "Charlie Davis",
    amount: 8.00,
    date: "2025-03-28",
    status: "Delivered"
  },
  {
    id: 12,
    product: "Milk",
    quantity: 4,
    seller: "Frank Wilson",
    amount: 4.00,
    date: "2025-03-25",
    status: "Delivered"
  },
  {
    id: 11,
    product: "Eggs",
    quantity: 30,
    seller: "Henry Harris",
    amount: 7.50,
    date: "2025-03-20",
    status: "Delivered"
  },
  {
    id: 10,
    product: "Mangoes",
    quantity: 8,
    seller: "Meena Devi",
    amount: 16.00,
    date: "2025-03-15",
    status: "Delivered"
  },
  {
    id: 9,
    product: "Wheat",
    quantity: 2,
    seller: "Charlie Davis",
    amount: 5.00,
    date: "2025-04-10",
    status: "Processing"
  },
  {
    id: 8,
    product: "Quinoa",
    quantity: 1,
    seller: "Rajesh Kumar",
    amount: 4.50,
    date: "2025-04-12",
    status: "Processing"
  }
];

const Orders: React.FC = () => {
  const { user, isAuthenticated, userType } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const isFarmer = userType === "Farmer";
  const orders = isFarmer ? mockFarmerOrders : mockBuyerOrders;

  // Filter orders based on search query and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === "" || 
      (isFarmer ? 
        (order.buyer.toLowerCase().includes(searchQuery.toLowerCase()) || 
         order.product.toLowerCase().includes(searchQuery.toLowerCase())) : 
        (order.product.toLowerCase().includes(searchQuery.toLowerCase()) || 
         order.seller.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-600";
      case "Shipped":
        return "bg-blue-100 text-blue-600";
      case "Processing":
        return "bg-purple-100 text-purple-600";
      case "Pending":
        return "bg-yellow-100 text-yellow-600";
      case "Cancelled":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered":
        return <Check className="h-4 w-4" />;
      case "Shipped":
        return <Package className="h-4 w-4" />;
      case "Processing":
      case "Pending":
        return <Clock className="h-4 w-4" />;
      case "Cancelled":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-agrilink-primary">Orders</h1>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Export Orders
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle>Order Management</CardTitle>
            <CardDescription>
              {isFarmer 
                ? "Manage and track orders from your customers" 
                : "Track your orders from various farmers"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search orders by product or customer..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <span className="flex items-center gap-2">
                      <Filter size={16} />
                      <SelectValue placeholder="Filter by status" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="all">All Orders</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="w-full">
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        {isFarmer ? <TableHead>Customer</TableHead> : <TableHead>Seller</TableHead>}
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id}</TableCell>
                            <TableCell>{isFarmer ? order.buyer : order.seller}</TableCell>
                            <TableCell>{order.product}</TableCell>
                            <TableCell>{order.quantity}</TableCell>
                            <TableCell>${order.amount.toFixed(2)}</TableCell>
                            <TableCell>{order.date}</TableCell>
                            <TableCell>
                              <span 
                                className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${getStatusBadgeClasses(order.status)}`}
                              >
                                {getStatusIcon(order.status)}
                                {order.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => navigate(`/order/${order.id}`)}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                            No orders match your search criteria
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="recent">
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        {isFarmer ? <TableHead>Customer</TableHead> : <TableHead>Seller</TableHead>}
                        <TableHead>Product</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.slice(0, 5).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>{isFarmer ? order.buyer : order.seller}</TableCell>
                          <TableCell>{order.product}</TableCell>
                          <TableCell>${order.amount.toFixed(2)}</TableCell>
                          <TableCell>{order.date}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${getStatusBadgeClasses(order.status)}`}
                            >
                              {getStatusIcon(order.status)}
                              {order.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/order/${order.id}`)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="pending">
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        {isFarmer ? <TableHead>Customer</TableHead> : <TableHead>Seller</TableHead>}
                        <TableHead>Product</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders
                        .filter(order => ["Pending", "Processing", "Shipped"].includes(order.status))
                        .map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id}</TableCell>
                            <TableCell>{isFarmer ? order.buyer : order.seller}</TableCell>
                            <TableCell>{order.product}</TableCell>
                            <TableCell>${order.amount.toFixed(2)}</TableCell>
                            <TableCell>{order.date}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${getStatusBadgeClasses(order.status)}`}
                              >
                                {getStatusIcon(order.status)}
                                {order.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/order/${order.id}`)}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="completed">
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        {isFarmer ? <TableHead>Customer</TableHead> : <TableHead>Seller</TableHead>}
                        <TableHead>Product</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders
                        .filter(order => order.status === "Delivered")
                        .map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id}</TableCell>
                            <TableCell>{isFarmer ? order.buyer : order.seller}</TableCell>
                            <TableCell>{order.product}</TableCell>
                            <TableCell>${order.amount.toFixed(2)}</TableCell>
                            <TableCell>{order.date}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${getStatusBadgeClasses(order.status)}`}
                              >
                                {getStatusIcon(order.status)}
                                {order.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/order/${order.id}`)}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Orders;
