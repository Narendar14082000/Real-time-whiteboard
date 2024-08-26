import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Whiteboard from './pages/Whiteboard';
import { keycloak, initializeKeycloak } from './keycloak';
import PrivateRoute from './components/PrivateRoute';

const App: React.FC = () => {
    const [keycloakInitialized, setKeycloakInitialized] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        initializeKeycloak()
            .then(() => {
                setKeycloakInitialized(true);
                setAuthenticated(keycloak.authenticated || false); // Ensure it's a boolean
            })
            .catch(() => {
                setKeycloakInitialized(true);
                setAuthenticated(false);
            });
    }, []);

    if (!keycloakInitialized) {
        return <div>Loading...</div>;
    }

    return (
        <Router>
            <div className="container mt-5">
                <Routes>
                    <Route path="/" element={
                        authenticated ? <PrivateRoute><Home /></PrivateRoute> : <div>Access Denied</div>
                    } />
                    <Route path="/whiteboard" element={<PrivateRoute><Whiteboard /></PrivateRoute>} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;
