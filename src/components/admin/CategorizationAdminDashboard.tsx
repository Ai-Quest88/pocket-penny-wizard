// Admin Dashboard for Smart Categorization System Monitoring
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { featureFlags } from '@/services/categorization/FeatureFlags';
import { categorizationMonitor } from '@/services/categorization/CategorizationMonitor';

export const CategorizationAdminDashboard: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [featureFlagStatus, setFeatureFlagStatus] = useState<any>(null);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = () => {
    // Get system-wide accuracy metrics
    const accuracyMetrics = categorizationMonitor.getSystemAccuracyMetrics(7);
    setSystemMetrics(accuracyMetrics);

    // Get performance metrics
    const perfMetrics = categorizationMonitor.getSystemPerformanceMetrics(7);
    setPerformanceMetrics(perfMetrics);

    // Get feature flag status
    const flags = featureFlags.getFlags();
    const rolloutStatus = featureFlags.getRolloutStatus();
    setFeatureFlagStatus({ flags, rolloutStatus });
  };

  const toggleFeatureFlag = () => {
    const currentFlags = featureFlags.getFlags();
    featureFlags.updateFlags({
      useSmartCategorization: !currentFlags.useSmartCategorization
    });
    loadMetrics();
  };

  const adjustRollout = (percentage: number) => {
    featureFlags.updateFlags({
      smartCategorizationRolloutPercentage: percentage
    });
    loadMetrics();
  };

  if (!systemMetrics || !performanceMetrics || !featureFlagStatus) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Loading metrics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Smart Categorization System - Admin Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Feature Flag Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Feature Flag Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant={featureFlagStatus.flags.useSmartCategorization ? "default" : "secondary"}>
                    {featureFlagStatus.flags.useSmartCategorization ? "Enabled" : "Disabled"}
                  </Badge>
                  <div className="text-xs text-gray-600">
                    Rollout: {featureFlagStatus.rolloutStatus.rolloutPercentage}%
                  </div>
                  <div className="text-xs text-gray-600">
                    Estimated Users: {featureFlagStatus.rolloutStatus.estimatedUsers}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  size="sm" 
                  variant={featureFlagStatus.flags.useSmartCategorization ? "destructive" : "default"}
                  onClick={toggleFeatureFlag}
                >
                  {featureFlagStatus.flags.useSmartCategorization ? "Disable" : "Enable"} Smart Categorization
                </Button>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => adjustRollout(25)}>25%</Button>
                  <Button size="sm" variant="outline" onClick={() => adjustRollout(50)}>50%</Button>
                  <Button size="sm" variant="outline" onClick={() => adjustRollout(100)}>100%</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="text-xs">
                    <span className="font-medium">Status:</span> 
                    <Badge variant="default" className="ml-1">Healthy</Badge>
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Sessions:</span> {performanceMetrics.totalSessions}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Accuracy Metrics */}
          <div>
            <h3 className="text-lg font-semibold mb-4">📊 Categorization Accuracy (Last 7 Days)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {systemMetrics.userHistoryHitRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">User History Hit Rate</div>
                  <div className="text-xs text-gray-500">Target: >60%</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {systemMetrics.systemKeywordHitRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">System Keywords Hit Rate</div>
                  <div className="text-xs text-gray-500">Target: >25%</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {systemMetrics.aiFallbackRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">AI Fallback Rate</div>
                  <div className="text-xs text-gray-500">Target: &lt;15%</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-gray-600">
                    {systemMetrics.userCorrectionRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">User Correction Rate</div>
                  <div className="text-xs text-gray-500">Target: &lt;10%</div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Performance Metrics */}
          <div>
            <h3 className="text-lg font-semibold mb-4">⚡ Performance Metrics (Last 7 Days)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {performanceMetrics.averageUserHistoryTime.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-gray-600">User History Lookup</div>
                  <div className="text-xs text-gray-500">Target: &lt;50ms</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {performanceMetrics.averageSystemKeywordTime.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-gray-600">System Keywords Lookup</div>
                  <div className="text-xs text-gray-500">Target: &lt;100ms</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {(performanceMetrics.averageAiTime / 1000).toFixed(1)}s
                  </div>
                  <div className="text-sm text-gray-600">AI Categorization</div>
                  <div className="text-xs text-gray-500">Target: 2-5s</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">
                    {(performanceMetrics.averageTotalTime / 1000).toFixed(1)}s
                  </div>
                  <div className="text-sm text-gray-600">Total Processing</div>
                  <div className="text-xs text-gray-500">Target: &lt;10s for 100 txns</div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Additional Metrics */}
          <div>
            <h3 className="text-lg font-semibold mb-4">📈 Additional Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-gray-600">
                    {systemMetrics.uncategorizedRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Uncategorized Rate</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-indigo-600">
                    {(systemMetrics.averageConfidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Average Confidence</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-teal-600">
                    {performanceMetrics.totalSessions}
                  </div>
                  <div className="text-sm text-gray-600">Total Sessions</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
