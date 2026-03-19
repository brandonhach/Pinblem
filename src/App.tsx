import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import PinDetail from "./pages/PinDetail";
import CreateListing from "./pages/CreateListing";
import Inbox from "./pages/Inbox";
import MyListings from "./pages/MyListings";
import SavedItems from "./pages/SavedItems";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();

const App = () => (
	<QueryClientProvider client={queryClient}>
		<TooltipProvider>
			<Toaster />
			<Sonner />
			<BrowserRouter>
				<AuthProvider>
					<Routes>
						<Route
							path='/auth/callback'
							element={<AuthCallback />}
						/>
						<Route
							path='/'
							element={<Index />}
						/>
						<Route
							path='/search'
							element={<Search />}
						/>
						<Route
							path='/profile/:id'
							element={<Profile />}
						/>
						<Route
							path='/pin/:id'
							element={<PinDetail />}
						/>

						{/* Protected routes */}
						<Route
							path='/create'
							element={
								<ProtectedRoute>
									<CreateListing />
								</ProtectedRoute>
							}
						/>

						<Route
							path='/inbox'
							element={
								<ProtectedRoute>
									<Inbox />
								</ProtectedRoute>
							}
						/>

						<Route
							path='/my-listings'
							element={
								<ProtectedRoute>
									<MyListings />
								</ProtectedRoute>
							}
						/>

						<Route
							path='/saved'
							element={
								<ProtectedRoute>
									<SavedItems />
								</ProtectedRoute>
							}
						/>

						<Route
							path='/settings'
							element={
								<ProtectedRoute>
									<Settings />
								</ProtectedRoute>
							}
						/>

						<Route
							path='/messages'
							element={
								<ProtectedRoute>
									<Messages />
								</ProtectedRoute>
							}
						/>

						<Route
							path='/login'
							element={<Login />}
						/>
						<Route
							path='*'
							element={<NotFound />}
						/>
					</Routes>
				</AuthProvider>
			</BrowserRouter>
		</TooltipProvider>
	</QueryClientProvider>
);

export default App;
