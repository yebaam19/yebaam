import { FC, useState } from 'react';
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
  question: string;
  answer: string;
  category: string;
}

// Mock FAQ data
const mockFAQs: FAQItem[] = [
  {
    id: '1',
    question: '¿Cuál es el horario de atención?',
    answer:
      'Estamos abiertos de lunes a viernes de 7:00 AM a 8:00 PM, sábados de 8:00 AM a 9:00 PM y domingos de 8:00 AM a 6:00 PM.',
    category: 'Horarios',
  },
  {
    id: '2',
    question: '¿Hacen envíos a domicilio?',
    answer:
      'Sí, realizamos envíos a domicilio en un radio de 5 km. El costo del envío es de $3 para pedidos menores a $20, y es gratis para pedidos mayores.',
    category: 'Envíos',
  },
  {
    id: '3',
    question: '¿Aceptan pedidos por adelantado?',
    answer:
      'Por supuesto. Puedes realizar pedidos con al menos 24 horas de anticipación llamando al teléfono o a través de nuestras redes sociales.',
    category: 'Pedidos',
  },
  {
    id: '4',
    question: '¿Tienen opciones sin gluten o veganas?',
    answer:
      'Sí, contamos con una línea completa de productos sin gluten y opciones veganas. Consulta nuestra sección de productos especiales.',
    category: 'Productos',
  },
  {
    id: '5',
    question: '¿Qué métodos de pago aceptan?',
    answer:
      'Aceptamos efectivo, tarjetas de débito y crédito (Visa, Mastercard, American Express), y transferencias bancarias.',
    category: 'Pagos',
  },
  {
    id: '6',
    question: '¿Tienen programa de fidelidad?',
    answer:
      'Sí, con cada $10 de compra acumulas 1 punto. Al llegar a 10 puntos recibes un 10% de descuento en tu próxima compra.',
    category: 'Beneficios',
  },
];

export const PageDetailFAQ: FC<PageDetailFAQProps> = ({ pageId }) => {
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  const categories = Array.from(new Set(mockFAQs.map((faq) => faq.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2">
          <QuestionMarkCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Preguntas frecuentes
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Encuentra respuestas a las preguntas más comunes
        </p>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-full">
          Todas
        </button>
        {categories.map((category) => (
          <button
            key={category}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-full transition-colors"
          >
            {category}
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
                    {faq.category}
                  </span>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    {faq.question}
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
                    {faq.answer}
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
          ¿No encontraste tu respuesta?
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
          Contáctanos directamente y te ayudaremos con lo que necesites.
        </p>
        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
          Enviar mensaje
        </button>
      </div>
    </div>
  );
};
