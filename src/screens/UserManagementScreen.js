"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Search, User, Mail, Calendar, Ban, UserCheck } from 'lucide-react';
import { apiCall } from '../../lib/api';

const UserManagementScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/users/admin/all', 'GET');
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId, reason = 'No reason provided') => {
    try {
      const response = await apiCall(`/users/admin/ban/${userId}`, 'POST', { reason });
      if (response.success) {
        fetchUsers();
        alert('User banned successfully');
      }
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Error banning user');
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      const response = await apiCall(`/users/admin/unban/${userId}`, 'POST');
      if (response.success) {
        fetchUsers();
        alert('User unbanned successfully');
      }
          } catch (error) {
      console.error('Error unbanning user:', error);
      alert('Error unbanning user');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-600 mt-2">View and manage your customer base.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <Card key={user._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{user.name || user.email}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={user.isBanned ? "destructive" : "default"}>
                  {user.isBanned ? "Banned" : "Active"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Joined: {formatDate(user.createdAt)}</span>
              </div>
              
              {user.isBanned && user.banReason && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  <strong>Ban Reason:</strong> {user.banReason}
                </div>
              )}

              <div className="flex gap-2">
                {user.isBanned ? (
                      <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleUnbanUser(user._id)}
                    className="flex items-center gap-1"
                  >
                    <UserCheck className="h-3 w-3" />
                    Unban
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const reason = prompt('Enter ban reason (optional):');
                      if (reason !== null) {
                        handleBanUser(user._id, reason);
                      }
                    }}
                    className="flex items-center gap-1"
                  >
                    <Ban className="h-3 w-3" />
                    Ban
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No users found</p>
        </div>
      )}
    </div>
  );
};

export default UserManagementScreen;
