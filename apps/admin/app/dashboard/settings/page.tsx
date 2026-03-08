'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import type { Settings } from '@/types';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get<{ settings: Settings }>('/admin/settings');
      return response.data.settings;
    },
  });

  const updateFareMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.patch('/admin/settings/fare', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSuccessMessage('Fare settings updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Failed to update fare settings');
      setTimeout(() => setErrorMessage(''), 5000);
    },
  });

  const updateGeofenceMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.patch('/admin/settings/geofence', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSuccessMessage('Geofence settings updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Failed to update geofence settings');
      setTimeout(() => setErrorMessage(''), 5000);
    },
  });

  const updateGeneralMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.patch('/admin/settings/general', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSuccessMessage('General settings updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Failed to update general settings');
      setTimeout(() => setErrorMessage(''), 5000);
    },
  });

  const handleFareSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateFareMutation.mutate({
      baseFare: parseFloat(formData.get('baseFare') as string),
      perKmRate: parseFloat(formData.get('perKmRate') as string),
      perMinuteRate: parseFloat(formData.get('perMinuteRate') as string),
      minimumFare: parseFloat(formData.get('minimumFare') as string),
      surgeMultiplier: parseFloat(formData.get('surgeMultiplier') as string),
      taxRate: parseFloat(formData.get('taxRate') as string),
    });
  };

  const handleGeofenceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateGeofenceMutation.mutate({
      enabled: formData.get('enabled') === 'true',
      maxDistanceKm: parseFloat(formData.get('maxDistanceKm') as string),
      centerCoordinates: {
        latitude: parseFloat(formData.get('latitude') as string),
        longitude: parseFloat(formData.get('longitude') as string),
      },
      radiusKm: parseFloat(formData.get('radiusKm') as string),
    });
  };

  const handleGeneralSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateGeneralMutation.mutate({
      appName: formData.get('appName') as string,
      supportEmail: formData.get('supportEmail') as string,
      supportPhone: formData.get('supportPhone') as string,
      maintenanceMode: formData.get('maintenanceMode') === 'true',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <div className="flex items-center justify-center p-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  const settings = settingsData!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500 mt-1">Manage system-wide configuration</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          {errorMessage}
        </div>
      )}

      <Tabs defaultValue="fare" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fare">Fare Settings</TabsTrigger>
          <TabsTrigger value="geofence">Geofence</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="fare">
          <Card>
            <CardHeader>
              <CardTitle>Fare Configuration</CardTitle>
              <CardDescription>
                Configure pricing, surge multiplier, and tax rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFareSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="baseFare">Base Fare ($)</Label>
                    <Input
                      id="baseFare"
                      name="baseFare"
                      type="number"
                      step="0.01"
                      defaultValue={settings.fare.baseFare}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="perKmRate">Per Kilometer Rate ($)</Label>
                    <Input
                      id="perKmRate"
                      name="perKmRate"
                      type="number"
                      step="0.01"
                      defaultValue={settings.fare.perKmRate}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="perMinuteRate">Per Minute Rate ($)</Label>
                    <Input
                      id="perMinuteRate"
                      name="perMinuteRate"
                      type="number"
                      step="0.01"
                      defaultValue={settings.fare.perMinuteRate}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimumFare">Minimum Fare ($)</Label>
                    <Input
                      id="minimumFare"
                      name="minimumFare"
                      type="number"
                      step="0.01"
                      defaultValue={settings.fare.minimumFare}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="surgeMultiplier">Surge Multiplier</Label>
                    <Input
                      id="surgeMultiplier"
                      name="surgeMultiplier"
                      type="number"
                      step="0.1"
                      defaultValue={settings.fare.surgeMultiplier}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (decimal)</Label>
                    <Input
                      id="taxRate"
                      name="taxRate"
                      type="number"
                      step="0.01"
                      defaultValue={settings.fare.taxRate}
                      required
                    />
                    <p className="text-xs text-gray-500">e.g., 0.1 for 10% tax</p>
                  </div>
                </div>
                <Button type="submit" disabled={updateFareMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateFareMutation.isPending ? 'Saving...' : 'Save Fare Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geofence">
          <Card>
            <CardHeader>
              <CardTitle>Geofence Configuration</CardTitle>
              <CardDescription>
                Set service area boundaries and distance limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGeofenceSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="enabled">Geofence Enabled</Label>
                  <Select name="enabled" defaultValue={settings.geofence.enabled ? 'true' : 'false'}>
                    <SelectTrigger id="enabled">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Enabled</SelectItem>
                      <SelectItem value="false">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="maxDistanceKm">Max Distance (km)</Label>
                    <Input
                      id="maxDistanceKm"
                      name="maxDistanceKm"
                      type="number"
                      step="1"
                      defaultValue={settings.geofence.maxDistanceKm}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="radiusKm">Service Radius (km)</Label>
                    <Input
                      id="radiusKm"
                      name="radiusKm"
                      type="number"
                      step="1"
                      defaultValue={settings.geofence.radiusKm}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Center Latitude</Label>
                    <Input
                      id="latitude"
                      name="latitude"
                      type="number"
                      step="0.000001"
                      defaultValue={settings.geofence.centerCoordinates.latitude}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Center Longitude</Label>
                    <Input
                      id="longitude"
                      name="longitude"
                      type="number"
                      step="0.000001"
                      defaultValue={settings.geofence.centerCoordinates.longitude}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={updateGeofenceMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateGeofenceMutation.isPending ? 'Saving...' : 'Save Geofence Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure app name, support contact, and maintenance mode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGeneralSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="appName">App Name</Label>
                    <Input
                      id="appName"
                      name="appName"
                      type="text"
                      defaultValue={settings.general.appName}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                    <Select
                      name="maintenanceMode"
                      defaultValue={settings.general.maintenanceMode ? 'true' : 'false'}
                    >
                      <SelectTrigger id="maintenanceMode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Disabled</SelectItem>
                        <SelectItem value="true">Enabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      name="supportEmail"
                      type="email"
                      defaultValue={settings.general.supportEmail}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportPhone">Support Phone</Label>
                    <Input
                      id="supportPhone"
                      name="supportPhone"
                      type="text"
                      defaultValue={settings.general.supportPhone}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={updateGeneralMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateGeneralMutation.isPending ? 'Saving...' : 'Save General Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
