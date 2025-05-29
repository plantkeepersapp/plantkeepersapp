import apiFetch from '@/API/api';

export const trackAdImpression = async ({
    ad_id,
    ad_network = 'AdMob',
    placement = 'home_banner',
    device_id,
    device_platform = 'android',
    is_test_ad = true,
}: {
    ad_id?: string;
    ad_network?: string;
    placement?: string;
    device_id: string;
    device_platform?: string;
    is_test_ad?: boolean;
}) => {
    return apiFetch('/track-impression/', {
        method: 'POST',
        body: JSON.stringify({
            ad_id,
            ad_network,
            placement,
            device_id,
            device_platform,
            is_test_ad,
        }),
    }, false);
};

export const trackAdClick = async ({
    impression_id,
    conversion_type,
    conversion_value,
}: {
    impression_id: string;
    conversion_type?: string;
    conversion_value?: number;
}) => {
    return apiFetch('/track-click/', {
        method: 'POST',
        body: JSON.stringify({
            impression_id,
            conversion_type,
            conversion_value,
        }),
    }, false);
};

