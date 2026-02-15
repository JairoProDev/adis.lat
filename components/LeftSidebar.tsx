'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import ModalNavegacionMobile from './ModalNavegacionMobile';

interface LeftSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenFavorites?: () => void;
    onOpenHidden?: () => void;
}

export default function LeftSidebar({ isOpen, onClose, onOpenFavorites, onOpenHidden }: LeftSidebarProps) {
    // Simply render the ModalNavegacionMobile component
    return (
        <ModalNavegacionMobile
            abierto={isOpen}
            onCerrar={onClose}
            onOpenFavorites={onOpenFavorites}
            onOpenHidden={onOpenHidden}
        />
    );
}
