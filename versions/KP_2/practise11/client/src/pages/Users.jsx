import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Users({ user }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            showNotification('Ошибка загрузки пользователей', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const response = await api.put(`/users/${userId}`, { role: newRole });
            setUsers(users.map(u => u.id === userId ? response.data : u));
            showNotification('Роль пользователя обновлена', 'success');
        } catch (error) {
            showNotification('Ошибка обновления роли', 'error');
        }
    };

    const handleBlockToggle = async (userId, currentBlocked) => {
        try {
            const response = await api.put(`/users/${userId}/block`, { isBlocked: !currentBlocked });
            setUsers(users.map(u => u.id === userId ? response.data : u));
            showNotification(
                !currentBlocked ? 'Пользователь заблокирован' : 'Пользователь разблокирован',
                'success'
            );
        } catch (error) {
            showNotification('Ошибка изменения статуса', 'error');
        }
    };

    const getRoleName = (role) => {
        const roles = {
            'admin': 'Администратор',
            'seller': 'Продавец',
            'user': 'Пользователь'
        };
        return roles[role] || role;
    };

    const getRoleBadgeClass = (role) => {
        const classes = {
            'admin': 'badge-admin',
            'seller': 'badge-seller',
            'user': 'badge-user'
        };
        return classes[role] || '';
    };

    if (loading) {
        return (
            <div className="container">
                <div className="loading">Загрузка...</div>
            </div>
        );
    }

    return (
        <div className="container">
            {notification && (
                <div className={`notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <h1 className="admin-title">Управление пользователями</h1>

            <section className="admin-panel">
                <h2>Список пользователей</h2>

                <div className="users-table-container">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Email</th>
                                <th>Имя</th>
                                <th>Фамилия</th>
                                <th>Роль</th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className={u.isBlocked ? 'blocked-user' : ''}>
                                    <td>{u.id}</td>
                                    <td>{u.email}</td>
                                    <td>{u.first_name}</td>
                                    <td>{u.last_name}</td>
                                    <td>
                                        {editingUser === u.id ? (
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                onBlur={() => setEditingUser(null)}
                                                autoFocus
                                            >
                                                <option value="user">Пользователь</option>
                                                <option value="seller">Продавец</option>
                                                <option value="admin">Администратор</option>
                                            </select>
                                        ) : (
                                            <span className={`role-badge ${getRoleBadgeClass(u.role)}`}>
                                                {getRoleName(u.role)}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${u.isBlocked ? 'blocked' : 'active'}`}>
                                            {u.isBlocked ? 'Заблокирован' : 'Активен'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn-edit"
                                            onClick={() => setEditingUser(u.id)}
                                            style={{ marginRight: '5px' }}
                                        >
                                            Изменить роль
                                        </button>
                                        <button
                                            className={u.isBlocked ? 'btn-unblock' : 'btn-delete'}
                                            onClick={() => handleBlockToggle(u.id, u.isBlocked)}
                                        >
                                            {u.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <style jsx>{`
                .users-table-container {
                    overflow-x: auto;
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                }

                .users-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .users-table th {
                    background: #2c3e50;
                    color: white;
                    padding: 12px;
                    text-align: left;
                }

                .users-table td {
                    padding: 12px;
                    border-bottom: 1px solid #ddd;
                }

                .users-table tr:hover {
                    background: #f5f5f5;
                }

                .blocked-user {
                    background: #fff3f3;
                }

                .blocked-user:hover {
                    background: #ffe6e6;
                }

                .role-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    font-weight: 600;
                }

                .badge-admin {
                    background: #dc3545;
                    color: white;
                }

                .badge-seller {
                    background: #ffc107;
                    color: #333;
                }

                .badge-user {
                    background: #6c757d;
                    color: white;
                }

                .status-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.9rem;
                }

                .status-badge.active {
                    background: #4caf50;
                    color: white;
                }

                .status-badge.blocked {
                    background: #dc3545;
                    color: white;
                }

                .btn-unblock {
                    background: #4caf50;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .btn-unblock:hover {
                    background: #45a049;
                }

                select {
                    padding: 6px;
                    border-radius: 4px;
                    border: 2px solid #4caf50;
                }
            `}</style>
        </div>
    );
}

export default Users;