import React, { useState } from "react";
import Layout from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { UserType } from "@/types";
import { Shovel } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Helper to reliably convert a string (like a Firebase UID) to a 32-bit positive integer
function hashToInteger(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

const terrainData = [
  { id: 1, type: 'Plain', crops: 'Wheat, Corn, Soybeans', practices: 'Use crop rotation and maintain soil pH.' },
  { id: 2, type: 'Hills', crops: 'Tea, Coffee, Fruits', practices: 'Terrace farming to prevent erosion.' },
  { id: 3, type: 'Drylands', crops: 'Millet, Sorghum, Cactus', practices: 'Drought-resistant crops and water harvesting.' },
  { id: 4, type: 'Wetlands', crops: 'Rice, Cranberries, Taro', practices: 'Manage water levels and use raised beds.' },
  { id: 5, type: 'Mountainous', crops: 'Potatoes, Barley, Herbs', practices: 'Slope management and erosion control' },
  { id: 11, type: 'Coastal', crops: 'Coconuts, Spinach, Salicornia', practices: 'Salt-tolerant crops and wind protection' },
];

const terrainTypes = [...new Set(terrainData.map(item => item.type))];

const Login: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType>("Buyer");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [selectedTerrain, setSelectedTerrain] = useState<string>("");

  if (isAuthenticated) {
    return <Navigate to={userType === "Farmer" ? "/farmer-dashboard" : "/buyer-dashboard"} />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;
      const userDoc = await getDoc(doc(db, "users", uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Auto-fix legacy string IDs for Postgres compliance
        if (typeof userData.id === 'string' || isNaN(userData.id)) {
           userData.id = hashToInteger(uid);
           await setDoc(doc(db, "users", uid), userData); // Save patched data
        }

        login(userData as any);
        toast({ title: "Login successful", description: `Welcome back, ${userData.name}` });
        navigate(userData.userType === "Farmer" ? "/farmer-dashboard" : "/buyer-dashboard");
      } else {
        // Fallback for very weird test accounts with no firestore doc
        const user = {
          id: hashToInteger(uid),
          name: name || "User",
          email,
          contactNumber,
          address,
          userType,
          registrationDate: new Date().toISOString().split("T")[0],
          terrain: selectedTerrain,
          recommendedCrops: "",
        };
        login(user as any);
        toast({ title: "Login successful", description: `Welcome back` });
        navigate(userType === "Farmer" ? "/farmer-dashboard" : "/buyer-dashboard");
      }
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !name) {
      toast({
        title: "Signup failed",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    if (userType === "Farmer" && !selectedTerrain) {
      toast({
        title: "Signup failed",
        description: "Please select a terrain type",
        variant: "destructive",
      });
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      const recommendedCrops =
        userType === "Farmer"
          ? terrainData.find((t) => t.type === selectedTerrain)?.crops || ""
          : "";

      const newUser = {
        id: hashToInteger(uid),
        firebaseUid: uid,
        name,
        email,
        contactNumber,
        address,
        userType,
        registrationDate: new Date().toISOString().split("T")[0],
        terrain: selectedTerrain,
        recommendedCrops,
      };

      await setDoc(doc(db, "users", uid), newUser); // Save to Firestore

      login(newUser as any);
      toast({ title: "Signup successful", description: `Welcome, ${name}` });
      navigate(userType === "Farmer" ? "/farmer-dashboard" : "/buyer-dashboard");
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" id="login-tab">Login</TabsTrigger>
              <TabsTrigger value="signup" id="signup-tab">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login to your account</CardTitle>
                  <CardDescription>
                    Enter your email below to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="account-type">Account Type</Label>
                      <div className="flex space-x-4">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="buyer"
                            name="account-type"
                            className="mr-2"
                            checked={userType === "Buyer"}
                            onChange={() => setUserType("Buyer")}
                          />
                          <Label htmlFor="buyer">Buyer</Label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="farmer"
                            name="account-type"
                            className="mr-2"
                            checked={userType === "Farmer"}
                            onChange={() => setUserType("Farmer")}
                          />
                          <Label htmlFor="farmer">Farmer</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="jane.smith@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        For demo: use jane.smith@example.com
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link to="#" className="text-xs text-agrilink-primary hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        For demo: any password works
                      </p>
                    </div>
                    
                    {userType === "Farmer" && (
                      <div className="space-y-2">
                        <Label htmlFor="terrain-type" className="flex items-center gap-2">
                          <Shovel className="h-4 w-4 text-green-600" />
                          Your Terrain Type
                        </Label>
                        <Select value={selectedTerrain} onValueChange={setSelectedTerrain}>
                          <SelectTrigger id="terrain-type" className="w-full">
                            <SelectValue placeholder="Select your terrain type" />
                          </SelectTrigger>
                          <SelectContent>
                            {terrainTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          This helps us suggest appropriate crops for your farm
                        </p>
                      </div>
                    )}
                    
                    <Button type="submit" className="w-full">
                      Login
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="text-center text-sm">
                  <p className="w-full">
                    Don't have an account?{" "}
                    <button 
                      onClick={() => document.getElementById("signup-tab")?.click()}
                      className="text-agrilink-primary hover:underline"
                    >
                      Sign up now
                    </button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="signup" id="signup-tab">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Enter your information to create your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-account-type">Account Type</Label>
                      <div className="flex space-x-4">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="signup-buyer"
                            name="signup-account-type"
                            className="mr-2"
                            checked={userType === "Buyer"}
                            onChange={() => setUserType("Buyer")}
                          />
                          <Label htmlFor="signup-buyer">Buyer</Label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="signup-farmer"
                            name="signup-account-type"
                            className="mr-2"
                            checked={userType === "Farmer"}
                            onChange={() => setUserType("Farmer")}
                          />
                          <Label htmlFor="signup-farmer">Farmer</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input 
                        id="signup-email" 
                        type="email" 
                        placeholder="john.doe@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} 
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input 
                          id="signup-password" 
                          type="password" 
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact">Contact Number</Label>
                        <Input 
                          id="contact" 
                          placeholder="123-456-7890" 
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input 
                        id="address" 
                        placeholder="123 Main St, City"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      />
                    </div>
                    
                    {userType === "Farmer" && (
                      <div className="p-4 bg-green-50 rounded-md border border-green-200">
                        <div className="space-y-2">
                          <Label htmlFor="signup-terrain-type" className="flex items-center gap-2">
                            <Shovel className="h-4 w-4 text-green-600" />
                            Your Terrain Type
                          </Label>
                          <Select value={selectedTerrain} onValueChange={setSelectedTerrain}>
                            <SelectTrigger id="signup-terrain-type" className="w-full bg-white">
                              <SelectValue placeholder="Select your terrain type" />
                            </SelectTrigger>
                            <SelectContent>
                              {terrainTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {selectedTerrain && (
                            <div className="mt-3 p-3 bg-white rounded border border-green-200">
                              <h4 className="text-sm font-medium mb-1">Recommended crops for {selectedTerrain}:</h4>
                              <p className="text-sm">
                                {terrainData.find(t => t.type === selectedTerrain)?.crops || "No recommendations available"}
                              </p>
                              <h4 className="text-sm font-medium mt-2 mb-1">Best farming practices:</h4>
                              <p className="text-sm">
                                {terrainData.find(t => t.type === selectedTerrain)?.practices || "No recommendations available"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <Button type="submit" className="w-full">
                      Create Account
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="text-center text-sm">
                  <p className="w-full">
                    Already have an account?{" "}
                    <button 
                      onClick={() => document.getElementById("login-tab")?.click()}
                      className="text-agrilink-primary hover:underline"
                    >
                      Login here
                    </button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Login;