import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import AdminCategoriesPage from "@/pages/AdminCategoriesPage";
import CategoriesPage from "@/pages/CategoriesPage";
import CategoryPage from "@/pages/CategoryPage";
import CommunityInfoPage from "@/pages/CommunityInfoPage";
import ContributorsPage from "@/pages/ContributorsPage";
import DiscussionPage from "@/pages/DiscussionPage";
import Home from "@/pages/Home";
import ProfilePage from "@/pages/ProfilePage";
import { Route, Router as WouterRouter, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Switch>
    <Route path="/" component={Home} />
    <Route path="/categories" component={CategoriesPage} />
    <Route path="/category/:slug" component={CategoryPage} />
    <Route path="/discussion/:id" component={DiscussionPage} />
    <Route path="/profile/:userId" component={ProfilePage} />
    <Route path="/contributors" component={ContributorsPage} />
    <Route path="/admin/categories" component={AdminCategoriesPage} />
    <Route path="/groups" component={() => <CommunityInfoPage kind="groups" />} />
    <Route path="/guidelines" component={() => <CommunityInfoPage kind="guidelines" />} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch></WouterRouter>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
