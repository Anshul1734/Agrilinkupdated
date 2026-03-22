
import React from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, LayoutDashboard, ShoppingBag, LogOut } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { UserType } from "@/types";

const Profile: React.FC = () => {
  const { user, isAuthenticated, userType, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out from your account"
    });
    navigate('/');
  };
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If farmer, redirect to farmer dashboard
  if (userType === "Farmer") {
    return <Navigate to="/farmer-dashboard" />;
  }
  
  // If buyer, redirect to buyer dashboard
  if (userType === "Buyer") {
    return <Navigate to="/buyer-dashboard" />;
  }
  
  // This code will only run if userType is neither Farmer nor Buyer
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full md:w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-agrilink-primary text-white flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    {user?.name}
                  </CardTitle>
                  <CardDescription>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-agrilink-primary/10 text-agrilink-primary text-xs">
                      {userType === "Farmer" ? "Farmer Account" : "Buyer Account"}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <nav className="flex flex-col space-y-1">
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link to="/profile">
                        <User className="mr-2 h-4 w-4" />
                        My Profile
                      </Link>
                    </Button>
                    {userType === "Farmer" && (
                      <Button variant="ghost" className="justify-start" asChild>
                        <Link to="/farmer-dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Farmer Dashboard
                        </Link>
                      </Button>
                    )}
                    {userType === "Buyer" && (
                      <Button variant="ghost" className="justify-start" asChild>
                        <Link to="/buyer-dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Buyer Dashboard
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link to="/my-reviews">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        My Orders
                      </Link>
                    </Button>
                    <Separator className="my-2" />
                    <Button 
                      variant="ghost" 
                      className="justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </nav>
                </CardContent>
              </Card>
            </div>
            
            {/* Main Content */}
            <div className="w-full md:w-2/3">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Your personal account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Full Name</h3>
                    <p>{user?.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Email Address</h3>
                    <p>{user?.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact Number</h3>
                    <p>{user?.contactNumber}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Address</h3>
                    <p>{user?.address}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Account Type</h3>
                    <p>{userType}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Registration Date</h3>
                    <p>{user?.registrationDate}</p>
                  </div>
                  
                  {userType === "Farmer" as UserType && (
                    <>
                      <Separator />
                      <div className="pt-2">
                        <h3 className="font-medium mb-2">Farmer Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Farm Location</h4>
                            <p>{user?.farmLocation || "Not specified"}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Farm Size</h4>
                            <p>{user?.farmSize ? `${user.farmSize} acres` : "Not specified"}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Terrain Type</h4>
                            <p>{user?.terrainType || "Not specified"}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
