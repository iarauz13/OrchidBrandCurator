
import React, { useState, useMemo } from 'react';
import { AppNotification, ThemeConfig } from '../types';
import { TagIcon } from './icons/TagIcon';
import { BellIcon } from './icons/BellIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';

interface NotificationsPageProps {
    title: string;
    notifications: AppNotification[];
    onMarkAllAsRead: () => void;
    onAcceptShare?: (notification: AppNotification) => void;
    theme: ThemeConfig;
}

const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

const BrandActivityFeed: React.FC<{ notifications: AppNotification[], theme: ThemeConfig }> = ({ notifications, theme }) => {
    const [activeFilter, setActiveFilter] = useState('all');

    const filters = [
        { key: 'all', label: 'All' },
        { key: 'new_collection', label: 'New Collections' },
        { key: 'sale', label: 'Sales' },
        { key: 'event', label: 'Events' },
    ];

    const filteredNotifications = useMemo(() => {
        if (activeFilter === 'all') {
            return notifications;
        }
        return notifications.filter(n => n.activityType === activeFilter);
    }, [notifications, activeFilter]);

    return (
        <div className="max-w-4xl mx-auto min-h-[60vh]">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-4xl font-light font-display transition-colors" style={{ color: theme.textPrimary }}>Brands Activity</h2>
            </div>

            <div className="flex gap-3 px-1 pb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
                {filters.map(filter => (
                    <button
                        key={filter.key}
                        onClick={() => setActiveFilter(filter.key)}
                        style={activeFilter === filter.key
                            ? { backgroundColor: theme.textPrimary, color: theme.background }
                            : { color: theme.textSecondary, borderColor: theme.border }}
                        className={`flex h-10 shrink-0 cursor-pointer items-center justify-center gap-x-2 rounded-full px-5 transition-all border ${activeFilter === filter.key
                            ? 'shadow-sm border-transparent'
                            : 'bg-transparent hover:bg-brand-secondary/10'
                            }`}
                    >
                        <p className="text-sm font-medium">{filter.label}</p>
                    </button>
                ))}
            </div>

            {filteredNotifications.length > 0 ? (
                <main className="flex flex-col gap-10">
                    {filteredNotifications.map(notification => (
                        <div key={notification.id} className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-3">
                                <img className="h-10 w-10 rounded-full bg-brand-surface border border-brand-border object-cover" alt={`${notification.storeName} logo`} src={notification.brandImageUrl} />
                                <div>
                                    <p className="font-semibold text-sm" style={{ color: theme.textPrimary }}>{notification.storeName}</p>
                                    <p className="text-xs" style={{ color: theme.textSecondary }}>{timeSince(notification.timestamp)}</p>
                                </div>
                            </div>
                            <div className="flex flex-col overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-subtle hover:shadow-subtle-hover transition-shadow">
                                {notification.activityImageUrl && (
                                    <div className="h-64 w-full bg-cover bg-center" style={{ backgroundImage: `url('${notification.activityImageUrl}')` }}></div>
                                )}
                                <div className="flex flex-col gap-4 p-6">
                                    <div className="flex flex-col gap-2">
                                        <h2 className="font-display text-3xl font-semibold leading-tight" style={{ color: theme.textOnSurfacePrimary }}>{notification.title}</h2>
                                        <p className="text-base leading-relaxed" style={{ color: theme.textOnSurfaceSecondary }}>{notification.message}</p>
                                    </div>
                                    {notification.ctaLink && notification.ctaText && (
                                        <a
                                            href={notification.ctaLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: theme.textOnSurfacePrimary, borderColor: theme.border }}
                                            className="h-12 w-full cursor-pointer rounded-lg border bg-brand-bg text-base font-semibold transition-all hover:bg-brand-primary hover:text-white flex items-center justify-center shadow-sm"
                                        >
                                            <span>{notification.ctaText}</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </main>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center mb-6 text-brand-text-secondary opacity-40">
                        <BellIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl font-semibold font-display mb-3" style={{ color: theme.textPrimary }}>All Quiet Here</h3>
                    <p className="max-w-sm leading-relaxed" style={{ color: theme.textSecondary }}>
                        New collection drops, restocks, and sales from your curated brands will appear here as they happen.
                    </p>
                </div>
            )}
        </div>
    );
};


const SocialFeed: React.FC<{ notifications: AppNotification[], onMarkAllAsRead: () => void, onAcceptShare?: (n: AppNotification) => void, theme: ThemeConfig }> = ({ notifications, onMarkAllAsRead, onAcceptShare, theme }) => {
    // "Frosted VIP" Design - Exclusive Invitation
    return (
        <div className="max-w-4xl mx-auto min-h-[65vh] flex items-center justify-center relative overflow-hidden rounded-3xl my-8">
            {/* 1. Abstract Elegant Background */}
            {/* Using a gradient mesh concept with brand colors */}
            <div
                className="absolute inset-0 opacity-40"
                style={{
                    background: `
                        radial-gradient(circle at 10% 20%, ${theme.secondary}30 0%, transparent 40%),
                        radial-gradient(circle at 90% 80%, ${theme.primary}20 0%, transparent 40%),
                        radial-gradient(circle at 50% 50%, ${theme.accent}10 0%, transparent 60%)
                    `,
                    filter: 'blur(60px)',
                }}
            />

            {/* 2. Glassmorphism Card */}
            <div
                className="relative z-10 p-12 max-w-lg w-full rounded-2xl border shadow-2xl flex flex-col items-center text-center transition-all duration-700 animate-in fade-in zoom-in-95"
                style={{
                    background: theme.isDarkBackground ? 'rgba(30, 30, 30, 0.4)' : 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)', // Safari support
                    borderColor: theme.border,
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
                }}
            >
                {/* Icon Badge */}
                <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-8 shadow-sm"
                    style={{ backgroundColor: theme.background }}
                >
                    <UsersIcon className="w-10 h-10" style={{ color: theme.primary }} />
                </div>

                {/* Typography */}
                <h2 className="text-4xl font-bold font-display mb-4 tracking-tight" style={{ color: theme.textPrimary }}>
                    The Inner Circle
                </h2>

                <div className="h-1 w-16 rounded-full mb-6" style={{ backgroundColor: theme.primary }} />

                <p className="text-lg leading-relaxed mb-10" style={{ color: theme.textSecondary }}>
                    Collaboration happens in the moment.<br />
                    Experience the full <span className="font-bold" style={{ color: theme.textPrimary }}>Orchid Social Network</span> exclusively on our mobile app.
                </p>

                {/* Call to Actions */}
                <div className="flex flex-col w-full gap-4">
                    <button className="flex items-center justify-center gap-3 w-full h-14 bg-black text-white rounded-xl hover:scale-[1.02] transition-transform active:scale-95 shadow-lg">
                        <svg viewBox="0 0 384 512" width="20" height="20" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-38.3-19.7-64.3-19.7-33.2 0-66.5 14.8-90 44.5-56.5 72.1-13.6 220 57 261.2 28.5 16.6 57 16.2 83.2-.3 25.1-15.8 55.4-15.8 80.9-.3 25.5 16.4 51.5 16.4 79.9.2 46.5-59.5 45.3-77.9 69-79.6-1.5-68.5-47.9-106.1-47.9-106.1 36.3 0 76.9 14.4 96.6 42.7-52.6 30.5-84.7 93.3-81.2 156.2z" /></svg>
                        <span className="font-semibold text-sm">Download on the App Store</span>
                    </button>

                    <button
                        className="flex items-center justify-center gap-3 w-full h-14 border rounded-xl hover:bg-black/5 transition-colors"
                        style={{ borderColor: theme.border, color: theme.textPrimary }}
                    >
                        <svg viewBox="0 0 512 512" width="20" height="20" fill="currentColor"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l220.7-221.3-60.1-60.1L92.7 413.5l11.9 85.5z" /></svg>
                        <span className="font-semibold text-sm">Get it on Google Play</span>
                    </button>
                </div>

                <p className="mt-8 text-xs font-medium tracking-wider uppercase opacity-50" style={{ color: theme.textSecondary }}>
                    Syncs seamlessly with your desktop
                </p>
            </div>
        </div>
    );
};


const NotificationsPage: React.FC<NotificationsPageProps> = ({ title, notifications, onMarkAllAsRead, onAcceptShare, theme }) => {
    if (title === 'Brands Activity') {
        return <BrandActivityFeed notifications={notifications} theme={theme} />;
    }

    if (title === 'Social Feed') {
        return <SocialFeed notifications={notifications} onMarkAllAsRead={onMarkAllAsRead} onAcceptShare={onAcceptShare} theme={theme} />
    }

    return <div className="text-center py-20 font-display text-2xl">Page not found.</div>;
};

export default NotificationsPage;
