'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, RefreshCw, Edit, Trash2, UserCheck, RotateCcw } from 'lucide-react';
import api from '@/lib/api';
import type { User } from '@/types';
import { format } from 'date-fns';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users', page, search, roleFilter, verifiedFilter, includeDeleted],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (verifiedFilter !== 'all') params.emailVerified = verifiedFilter === 'verified';
      if (includeDeleted) params.includeDeleted = 'true';

      const response = await api.get('/admin/users', { params });
      return response.data;
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const restoreUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/admin/users/${userId}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.patch(`/admin/users/${userId}/verify-email`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'driver':
        return 'bg-blue-100 text-blue-800';
      case 'passenger':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-gray-500 mt-1">Manage all users in the system</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Email, phone, or name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button size="icon" variant="outline" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="passenger">Passenger</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verified">Email Status</Label>
              <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                <SelectTrigger id="verified">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deleted">Show Deleted</Label>
              <Select
                value={includeDeleted ? 'yes' : 'no'}
                onValueChange={(v) => setIncludeDeleted(v === 'yes')}
              >
                <SelectTrigger id="deleted">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Hide deleted</SelectItem>
                  <SelectItem value="yes">Show deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button variant="outline" className="w-full" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-sm text-gray-500">Loading users...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">Failed to load users</p>
              <p className="text-sm text-gray-500 mt-1">{(error as any).message}</p>
            </div>
          ) : data?.users?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No users found</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.users?.map((user: User) => (
                    <TableRow key={user._id} className={user.isDeleted ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                      <TableCell>{user.email || 'N/A'}</TableCell>
                      <TableCell>{user.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.emailVerified ? (
                          <span className="text-green-600">✓ Verified</span>
                        ) : (
                          <span className="text-gray-400">Not verified</span>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.isDeleted ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => restoreUserMutation.mutate(user._id)}
                              disabled={restoreUserMutation.isPending}
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          ) : (
                            <>
                              {!user.emailVerified && user.email && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => verifyEmailMutation.mutate(user._id)}
                                  disabled={verifyEmailMutation.isPending}
                                  title="Verify email"
                                >
                                  <UserCheck className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this user?')) {
                                    deleteUserMutation.mutate(user._id);
                                  }
                                }}
                                disabled={deleteUserMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data?.pagination && (
                <div className="flex items-center justify-between border-t p-4">
                  <div className="text-sm text-gray-500">
                    Showing {(page - 1) * data.pagination.limit + 1} to{' '}
                    {Math.min(page * data.pagination.limit, data.pagination.total)} of{' '}
                    {data.pagination.total} users
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">
                        Page {page} of {data.pagination.pages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= data.pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
