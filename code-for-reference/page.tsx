// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandTable } from '@/components/brand-table';
import { BrandComparison } from '@/components/brand-comparison';
import { BrandGroupList } from '@/components/brand-group-list';
import { Dashboard } from '@/components/dashboard';
import type { Brand, BrandGroup, BrandAnalytics } from '@/types';

export default function Home() {
  const [selectedBrands, setSelectedBrands] = useState<Brand[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analytics, setAnalytics] = useState<BrandAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load analytics data on initial render
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics');
        const data = await response.json();
        
        if (data.success) {
          setAnalytics(data.data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);

  // Handle brand selection changes
  const handleBrandSelection = (brand: Brand, selected: boolean) => {
    if (selected) {
      setSelectedBrands(prev => [...prev, brand]);
    } else {
      setSelectedBrands(prev => prev.filter(b => b.id !== brand.id));
    }
  };

  // Clear all selected brands
  const clearSelectedBrands = () => {
    setSelectedBrands([]);
  };

  // Handle successful brand group creation
  const handleBrandGroupCreated = () => {
    // Refresh analytics
    fetch('/api/analytics')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setAnalytics(data.data);
        }
      })
      .catch(error => {
        console.error('Error refreshing analytics:', error);
      });
    
    // Clear selected brands
    clearSelectedBrands();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Brand Matching Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage and match brands across different e-commerce platforms
          </p>
        </header>

        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="brands">Brands</TabsTrigger>
            <TabsTrigger 
              value="comparison"
              disabled={selectedBrands.length < 2}
            >
              Comparison ({selectedBrands.length})
            </TabsTrigger>
            <TabsTrigger value="groups">Brand Groups</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
            <Dashboard analytics={analytics} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="brands" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Brand Management</CardTitle>
                <CardDescription>
                  Select brands to compare and match from different sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BrandTable 
                  onBrandSelection={handleBrandSelection} 
                  selectedBrands={selectedBrands}
                  onClearSelection={clearSelectedBrands}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="comparison" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Brand Comparison</CardTitle>
                <CardDescription>
                  Compare and match selected brands
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BrandComparison 
                  selectedBrands={selectedBrands} 
                  onClearSelection={clearSelectedBrands}
                  onBrandGroupCreated={handleBrandGroupCreated}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="groups" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Brand Groups</CardTitle>
                <CardDescription>
                  Manage brand groupings and mappings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BrandGroupList />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}