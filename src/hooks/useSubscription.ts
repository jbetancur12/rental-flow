import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../config/api';
import { OrganizationSettings } from '../types/auth';

interface SubscriptionLimits {
    maxProperties: number;
    maxTenants: number;
    maxUsers: number;
    storageGB: number;
}

interface SubscriptionFeatures {
    multipleProperties: boolean;
    advancedReports: boolean;
    apiAccess: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
}

interface SubscriptionUsage {
    properties: number;
    tenants: number;
    users: number;
    storageUsed: number;
}

export function useSubscription() {
    const { state: authState } = useAuth();
    const [usage, setUsage] = useState<SubscriptionUsage>({
        properties: 0,
        tenants: 0,
        users: 0,
        storageUsed: 0
    });
    const [isLoading, setIsLoading] = useState(false);

    const { subscription, organization } = authState;

    // Calculate days remaining in trial
    const daysRemaining = useMemo(() => {
        if (!subscription?.trialEnd) return 0;
        const diffTime = new Date(subscription.trialEnd).getTime() - new Date().getTime();
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }, [subscription]);

    const isActive = useMemo(() => {
        if (!subscription) return false;
        if (subscription.status === 'ACTIVE') return true;
        if (subscription.status === 'TRIALING') {
            return daysRemaining > 0;
        }
        return false;
    }, [subscription, daysRemaining]);

    // Check if trial has expired
    const isTrialExpired = () => {
        if (!subscription?.trialEnd) return false;
        return new Date() > new Date(subscription.trialEnd);
    };

    const limits = useMemo((): SubscriptionLimits => {
        const defaultLimits = { maxProperties: 0, maxTenants: 0, maxUsers: 0, storageGB: 0 };
        const settings = organization?.settings as OrganizationSettings;
        return settings?.limits || defaultLimits;
    }, [organization]);

    const features = useMemo((): SubscriptionFeatures => {
        const defaultFeatures = { multipleProperties: false, advancedReports: false, apiAccess: false, customBranding: false, prioritySupport: false };
        const settings = organization?.settings as OrganizationSettings;
        return settings?.features || defaultFeatures;
    }, [organization]);

    const isLimitExceeded = useCallback((type: keyof SubscriptionLimits) => {
        return usage[type as keyof SubscriptionUsage] >= limits[type];
    }, [usage, limits]);

    const hasFeature = useCallback((feature: keyof SubscriptionFeatures) => {
        return !!features[feature];
    }, [features]);
    // Check if subscription is active
    const isSubscriptionActive = useMemo(() => {
        if (!subscription) return false;
        return subscription.status === 'ACTIVE' ||
            (subscription.status === 'TRIALING' && !isTrialExpired());
    }, [subscription]);

    // Get current limits based on plan
    const getLimits = (): SubscriptionLimits => {
        if (!organization?.settings?.limits) {
            return {
                maxProperties: 10,
                maxTenants: 20,
                maxUsers: 2,
                storageGB: 5
            };
        }
        return organization.settings.limits;
    };

    // Get current features based on plan
    const getFeatures = (): SubscriptionFeatures => {
        if (!organization?.settings?.features) {
            return {
                multipleProperties: false,
                advancedReports: false,
                apiAccess: false,
                customBranding: false,
                prioritySupport: false
            };
        }
        return organization.settings.features;
    };


    // Get usage percentage for a limit
    const getUsagePercentage = (type: keyof SubscriptionLimits) => {
        const limits = getLimits();
        const currentUsage = usage[type as keyof SubscriptionUsage];
        return Math.min(100, (currentUsage / limits[type]) * 100);
    };

    // Load current usage from API
    const loadUsage = async () => {
        if (!authState.isAuthenticated) return;

        setIsLoading(true);
        try {
            const response = await apiClient.request('/organizations/usage', {
                method: 'GET'
            });
            setUsage(response.usage);
        } catch (error) {
            console.error('Failed to load usage:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Upgrade subscription
    const upgradeSubscription = async (planId: string) => {
        try {
            // const response = await apiClient.request('/subscriptions/upgrade', {
            //     method: 'POST',
            //     body: JSON.stringify({ planId })
            // });
            // return response;
        } catch (error) {
            console.error('Failed to upgrade subscription:', error);
            throw error;
        }
    };

    // Cancel subscription
    const cancelSubscription = async () => {
        try {
            // const response = await apiClient.request('/subscriptions/cancel', {
            //     method: 'POST'
            // });
            // return response;
        } catch (error) {
            console.error('Failed to cancel subscription:', error);
            throw error;
        }
    };

    // Reactivate subscription
    const reactivateSubscription = async () => {
        try {
            // const response = await apiClient.request('/subscriptions/reactivate', {
            //     method: 'POST'
            // });
            // return response;
        } catch (error) {
            console.error('Failed to reactivate subscription:', error);
            throw error;
        }
    };

    // Load usage on mount and when auth state changes
    useEffect(() => {
        if (authState.isAuthenticated && authState.organization) {
            loadUsage();
        }
    }, [authState.isAuthenticated, authState.organization]);

    return {
        subscription,
        organization,
        usage,
        isLoading,
        daysRemaining,
        isTrialExpired,
        isActive,
        isSubscriptionActive,
        limits,
        getLimits,
        getFeatures,
        isLimitExceeded,
        hasFeature,
        getUsagePercentage,
        loadUsage,
        upgradeSubscription,
        cancelSubscription,
        reactivateSubscription
    };
}