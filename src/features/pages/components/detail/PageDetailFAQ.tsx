'use client';

import { FC, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  QuestionMarkCircleIcon,
} from '@/components/icons/heroicons-shim';

interface PageDetailFAQProps {
  pageId: string;
}

interface FAQItem {
  id: string;
  questionKey: string;
  answerKey: string;
  categoryKey: string;
}

// Mock FAQ data — content sourced from i18n catalog
const mockFAQs: FAQItem[] = [
  { id: '1', questionKey: 'hoursQ', answerKey: 'hoursA', categoryKey: 'hours' },
  { id: '2', questionKey: 'shippingQ', answerKey: 'shippingA', categoryKey: 'shipping' },
  { id: '3', questionKey: 'ordersQ', answerKey: 'ordersA', categoryKey: 'orders' },
  { id: '4', questionKey: 'productsQ', answerKey: 'productsA', categoryKey: 'products' },
  { id: '5', questionKey: 'paymentsQ', answerKey: 'paymentsA', categoryKey: 'payments' },
  { id: '6', questionKey: 'benefitsQ', answerKey: 'benefitsA', categoryKey: 'benefits' },
];

export const PageDetailFAQ: FC<PageDetailFAQProps> = ({ pageId }) => {
  const t = useTranslations('pages');
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  const categories = Array.from(new Set(mockFAQs.map((faq) => faq.categoryKey)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2">
          <QuestionMarkCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('faq.title')}
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('faq.subtitle')}
        </p>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-full">
          {t('faq.all')}
        </button>
        {categories.map((categoryKey) => (
          <button
            key={categoryKey}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-full transition-colors"
          >
            {t(`faq.categories.${categoryKey}` as const)}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="space-y-3">
        {mockFAQs.map((faq) => {
          const isOpen = openFAQ === faq.id;

          return (
            <div
              key={faq.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex-1 pr-4">
                  <span className="inline-block px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded mb-2">
                    {t(`faq.categories.${faq.categoryKey}` as const)}
                  </span>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    {t(`faq.items.${faq.questionKey}` as const)}
                  </h3>
                </div>
                {isOpen ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {t(`faq.items.${faq.answerKey}` as const)}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-300 font-medium mb-2">
          {t('faq.noAnswerTitle')}
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
          {t('faq.noAnswerDescription')}
        </p>
        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
          {t('faq.sendMessage')}
        </button>
      </div>
    </div>
  );
};
