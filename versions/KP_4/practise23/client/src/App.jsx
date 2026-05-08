import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Login from './pages/Login';
import Main from './pages/Main';
import Admin from './pages/Admin';
import Users from './pages/Users';
import api from './services/api';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const savedUser = localStorage.getItem('user');
        
        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const handleLogin = (userData, accessToken, refreshToken) => {
        setUser(userData);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await api.post('/auth/logout', { refreshToken });
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    };

    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    return (
        <Router>
            <div className="App">
                {user && <Header user={user} onLogout={handleLogout} />}
                <Routes>
                    <Route path="/login" element={
                        user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
                    } />
                    <Route path="/" element={
                        user ? <Main user={user} /> : <Navigate to="/login" />
                    } />
                    <Route path="/admin" element={
                        user && (user.role === 'admin' || user.role === 'seller') ? 
                            <Admin user={user} /> : <Navigate to="/" />
                    } />
                    <Route path="/users" element={
                        user && user.role === 'admin' ? 
                            <Users user={user} /> : <Navigate to="/" />
                    } />
                </Routes>
            </div>
        </Router>
    );
}

export default App;