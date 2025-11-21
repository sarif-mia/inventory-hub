import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ShortcutConfig {
    key: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    action: () => void;
    description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't trigger shortcuts when user is typing in input fields
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                event.target instanceof HTMLSelectElement ||
                (event.target as HTMLElement)?.contentEditable === 'true'
            ) {
                return;
            }

            for (const shortcut of shortcuts) {
                if (
                    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
                    !!event.ctrlKey === !!shortcut.ctrlKey &&
                    !!event.altKey === !!shortcut.altKey &&
                    !!event.shiftKey === !!shortcut.shiftKey
                ) {
                    event.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
}

// Common shortcuts that can be used across the app
export function useGlobalKeyboardShortcuts() {
    const navigate = useNavigate();

    const shortcuts: ShortcutConfig[] = [
        {
            key: 'd',
            ctrlKey: true,
            action: () => navigate('/dashboard'),
            description: 'Go to Dashboard',
        },
        {
            key: 'p',
            ctrlKey: true,
            action: () => navigate('/products'),
            description: 'Go to Products',
        },
        {
            key: 'o',
            ctrlKey: true,
            action: () => navigate('/orders'),
            description: 'Go to Orders',
        },
        {
            key: 'i',
            ctrlKey: true,
            action: () => navigate('/inventory'),
            description: 'Go to Inventory',
        },
        {
            key: 'c',
            ctrlKey: true,
            action: () => navigate('/channels'),
            description: 'Go to Channels',
        },
        {
            key: 'n',
            ctrlKey: true,
            action: () => {
                // This would need to be context-aware, but for now just show a toast
                toast.info('Use Ctrl+N in specific pages to create new items');
            },
            description: 'Create New Item (context-aware)',
        },
        {
            key: '/',
            ctrlKey: true,
            action: () => {
                // Focus search input if available
                const searchInput = document.querySelector('input[placeholder*="search" i], input[placeholder*="Search" i]') as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            },
            description: 'Focus Search',
        },
        {
            key: '?',
            shiftKey: true,
            action: () => {
                toast.info(
                    'Keyboard Shortcuts:\n' +
                    'Ctrl+D: Dashboard\n' +
                    'Ctrl+P: Products\n' +
                    'Ctrl+O: Orders\n' +
                    'Ctrl+I: Inventory\n' +
                    'Ctrl+C: Channels\n' +
                    'Ctrl+/: Focus Search\n' +
                    'Shift+?: Show Shortcuts'
                );
            },
            description: 'Show Keyboard Shortcuts',
        },
    ];

    useKeyboardShortcuts(shortcuts);
}