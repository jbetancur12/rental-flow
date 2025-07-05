import { useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { OrganizationSettings } from '../types/auth';
import { useApp } from '../context/AppContext';

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
    const { state: appState } = useApp();


    const { subscription, organization } = authState;

    const usage = useMemo((): SubscriptionUsage => ({
        properties: appState.properties.length,
        tenants: appState.tenants.length,
        users: 1, // Puedes hacer este cálculo más complejo si es necesario
        storageUsed: 0 // Esto es más difícil de calcular en el front, 0 es un placeholder
    }), [appState.properties, appState.tenants]);

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

const isLimitExceeded = useCallback((usageType: keyof SubscriptionUsage) => {
    // 1. Mapa que conecta el tipo de uso con el nombre de su límite
    const usageToLimitMap: { [key in keyof SubscriptionUsage]: keyof SubscriptionLimits } = {
        properties: 'maxProperties',
        tenants: 'maxTenants',
        users: 'maxUsers',
        storageUsed: 'storageGB'
    };

    // 2. Obtenemos el nombre del límite correspondiente
    const limitKey = usageToLimitMap[usageType];
    
    // 3. Obtenemos los valores correctos de cada objeto
    const limit = limits[limitKey];
    const current = usage[usageType];


    // 4. Realizamos la comparación segura
    return limit > 0 && current >= limit;
}, [usage, limits]);

    const hasFeature = useCallback((feature: keyof SubscriptionFeatures) => {
        return !!features[feature];
    }, [features]);

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



    // Upgrade subscription
    // const upgradeSubscription = async (planId: string) => {
    //     try {
    //         // const response = await apiClient.request('/subscriptions/upgrade', {
    //         //     method: 'POST',
    //         //     body: JSON.stringify({ planId })
    //         // });
    //         // return response;
    //     } catch (error) {
    //         console.error('Failed to upgrade subscription:', error);
    //         throw error;
    //     }
    // };

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


    return {
        subscription,
        organization,
        usage,
        daysRemaining,
        isTrialExpired,
        isActive,
        limits,
        getLimits,
        getFeatures,
        isLimitExceeded,
        hasFeature,
        getUsagePercentage,
        // upgradeSubscription,
        cancelSubscription,
        reactivateSubscription
    };
}