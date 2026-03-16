import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Main from './pages/Main';
import Admin from './pages/Admin';
import './App.css';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const savedUser = localStorage.getItem('user');
        if (token && savedUser) {
            setIsAuthenticated(true);
            setUser(JSON.parse(savedUser));
        }
    }, []);

    return (
        <Router>
            <div className="App">
                <Header
                    isAuthenticated={isAuthenticated}
                    user={user}
                    setIsAuthenticated={setIsAuthenticated}
                    setUser={setUser}
                />
                <Routes>
                    <Route path="/login" element={
                        <Login
                            setIsAuthenticated={setIsAuthenticated}
                            setUser={setUser}
                        />
                    } />

                    <Route path="/" element={
                        <PrivateRoute isAuthenticated={isAuthenticated}>
                            <Main user={user} />
                        </PrivateRoute>
                    } />

                    <Route path="/admin" element={
                        <PrivateRoute isAuthenticated={isAuthenticated}>
                            <Admin user={user} />
                        </PrivateRoute>
                    } />

                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;