import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { dashboardPath } from "@/lib/routes";
import Layout from "@/components/Layout";
import { PageMessage, PageSpinner } from "@/components/PageState";
import type { UserType } from "@/types";

/**
 * Route guard. Waits for Firebase to restore the session first (so a refresh on /orders
 * doesn't bounce a signed-in user to /login), then checks sign-in, profile and role.
 * This is a UX convenience only - the API enforces the same rules on every request.
 */
const RequireAuth: React.FC<{ role?: UserType }> = ({ role }) => {
  const { status, profile, retry } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <Layout>
        <PageSpinner label="Checking your session…" />
      </Layout>
    );
  }
  if (status === "signedOut") return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  if (status === "needsProfile") return <Navigate to="/complete-profile" replace />;
  if (status === "error") {
    return (
      <Layout>
        <PageMessage
          title="We couldn't load your account"
          description="The server may be temporarily unavailable. Please try again."
          action={{ label: "Try again", onClick: retry }}
        />
      </Layout>
    );
  }
  if (role && profile?.role !== role) return <Navigate to={dashboardPath(profile?.role)} replace />;
  return <Outlet />;
};

export default RequireAuth;
