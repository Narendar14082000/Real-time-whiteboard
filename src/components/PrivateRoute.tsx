import React from 'react';
import { Navigate, RouteProps } from 'react-router-dom';
import { keycloak } from '../keycloak';

const PrivateRoute: React.FC<RouteProps & { role?: string }> = ({ children, role }) => {
    if (!keycloak.authenticated) {
        return <Navigate to="/" />;
    }

    if (role && !keycloak.hasRealmRole(role)) {
        return <div>Access Denied</div>; // Or redirect to a different page
    }

    return <>{children}</>;
};

export default PrivateRoute;