import { FC } from 'react';
import {
  PhotoIcon,
  UsersIcon,
  StarIcon,
  QuestionMarkCircleIcon,
  TagIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { usePagePhotosCount } from '../../hooks/usePagePhotos';
import { usePageBySlug } from '../../hooks/usePages';
import { useReviewStats } from '../../hooks/usePageReviews';
import { useActivePromotions } from '../../hooks/usePagePromotions';
import { usePageConversations } from '../../hooks/usePageMessages';
import { usePageProducts } from '@/hooks/usePageProducts';

type SidebarSection =
  | 'fotos'
  | 'comunidad'
  | 'valoraciones'
  | 'preguntas'
  | 'promociones'
  | 'productos'
  | 'insignias'
  | 'mensajes';

interface SidebarItem {
  id: SidebarSection;
  label: string;
  icon: typeof PhotoIcon;
  count?: number;
  ownerOnly?: boolean; // New property to mark owner-only sections
}

interface PageDetailSidebarProps {
  pageId: string;
  pageSlug?: string;
  activeSection?: SidebarSection;
  onSectionChange?: (section: SidebarSection) => void;
  isOwner?: boolean; // New prop to determine if user is owner
}

const sidebarItems: SidebarItem[] = [
  { id: 'fotos', label: 'Fotos', icon: PhotoIcon },
  { id: 'comunidad', label: 'Comunidad', icon: UsersIcon },
  { id: 'valoraciones', label: 'Valoraciones', icon: StarIcon },
  { id: 'preguntas', label: 'Preguntas frecuentes', icon: QuestionMarkCircleIcon, count: 6 },
  { id: 'promociones', label: 'Promociones', icon: TagIcon },
  { id: 'productos', label: 'Productos', icon: ShoppingBagIcon },
  { id: 'insignias', label: 'Insignias', icon: TrophyIcon, count: 8 },
  { id: 'mensajes', label: 'Mensajes', icon: ChatBubbleLeftRightIcon, ownerOnly: true },
];

export const PageDetailSidebar: FC<PageDetailSidebarProps> = ({
  pageId,
  pageSlug,
  activeSection,
  onSectionChange,
  isOwner = false,
}) => {
  // Get real photos count
  const { data: photosCount = 0 } = usePagePhotosCount(pageId);
  
  // Get page data for follower count
  const { data: pageResponse } = usePageBySlug(pageSlug || '');
  const followerCount = pageResponse?.page?.followerCount || 0;

  // Get real reviews count
  const { data: reviewStats } = useReviewStats(pageId);
  const reviewCount = reviewStats?.totalReviews || 0;

  // Get real promotions count
  const { data: activePromotions = [] } = useActivePromotions(pageId);
  const promotionsCount = activePromotions.length;

  // Get products count
  const { data: productsData } = usePageProducts(pageId, {
    page: 1,
    limit: 1,
    isActive: true,
  });
  const productsCount = productsData?.total || 0;

  // Get unread messages count (only for owner)
  const { data: conversationsData } = usePageConversations(
    isOwner ? pageId : undefined,
    { page: 1, limit: 50, includeArchived: false }
  );
  const unreadMessagesCount = conversationsData?.conversations.reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
  ) ?? 0;

  // Update items with real counts
  const items = sidebarItems
    .filter((item) => !item.ownerOnly || isOwner) // Filter out owner-only items if not owner
    .map((item) => {
      if (item.id === 'fotos') return { ...item, count: photosCount };
      if (item.id === 'comunidad') return { ...item, count: followerCount };
      if (item.id === 'valoraciones') return { ...item, count: reviewCount };
      if (item.id === 'promociones') return { ...item, count: promotionsCount };
      if (item.id === 'productos') return { ...item, count: productsCount };
      if (item.id === 'mensajes') return { ...item, count: unreadMessagesCount };
      return item;
    });
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white px-3">
        Más sobre esta página
      </h3>
      
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange?.(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400'
                  }`}
                />
                <span className={`text-sm font-medium ${
                  isActive 
                    ? 'text-blue-900 dark:text-blue-300' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {item.label}
                </span>
              </div>
              {item.count !== undefined && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Info Card */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Explora más
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          Descubre fotos, conoce a la comunidad, lee valoraciones y aprovecha las promociones exclusivas.
        </p>
      </div>
    </div>
  );
};
