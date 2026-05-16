'use client';

import { useTranslations } from 'next-intl';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { CreateProductDto } from '@/interfaces/page-product.interface';

interface ProductFormFieldsProps {
  register: UseFormRegister<CreateProductDto>;
  errors: FieldErrors<CreateProductDto>;
  showAdvancedFields?: boolean;
}

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export function ProductFormFields({ register, errors, showAdvancedFields = false }: ProductFormFieldsProps) {
  const t = useTranslations('businesses.products.formFields');
  return (
    <div className="space-y-4">
      {/* Name - OBLIGATORIO */}
      <div>
        <label htmlFor="name" className={labelClass}>{t('nameLabel')}</label>
        <input
          {...register('name', { required: t('nameRequired') })}
          type="text"
          id="name"
          className={inputClass}
          placeholder={t('namePlaceholder')}
        />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
      </div>

      {/* Description - OPCIONAL pero recomendado */}
      <div>
        <label htmlFor="description" className={labelClass}>{t('descriptionLabel')}</label>
        <textarea
          {...register('description')}
          id="description"
          rows={3}
          className={inputClass}
          placeholder={t('descriptionPlaceholder')}
        />
      </div>

      {/* Price - OBLIGATORIO */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className={labelClass}>{t('priceLabel')}</label>
          <input
            {...register('price', {
              required: t('priceRequired'),
              valueAsNumber: true,
              min: { value: 0.01, message: t('priceMin') }
            })}
            type="number"
            step="0.01"
            id="price"
            className={inputClass}
            placeholder={t('pricePlaceholder')}
          />
          {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>}
        </div>
        <div>
          <label htmlFor="compareAtPrice" className={labelClass}>{t('compareAtPriceLabel')}</label>
          <input
            {...register('compareAtPrice', {
              valueAsNumber: true,
              min: { value: 0, message: t('compareAtPriceMin') }
            })}
            type="number"
            step="0.01"
            id="compareAtPrice"
            className={inputClass}
            placeholder={t('compareAtPricePlaceholder')}
          />
          {errors.compareAtPrice && <p className="text-red-600 text-sm mt-1">{errors.compareAtPrice.message}</p>}
        </div>
      </div>

      {/* Category - OPCIONAL */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="categoryMain" className={labelClass}>{t('categoryMainLabel')}</label>
          <input
            {...register('categoryMain')}
            type="text"
            id="categoryMain"
            className={inputClass}
            placeholder={t('categoryMainPlaceholder')}
          />
        </div>
        <div>
          <label htmlFor="categorySub" className={labelClass}>{t('categorySubLabel')}</label>
          <input
            {...register('categorySub')}
            type="text"
            id="categorySub"
            className={inputClass}
            placeholder={t('categorySubPlaceholder')}
          />
        </div>
      </div>

      {/* Advanced Fields - Solo si se solicitan */}
      {showAdvancedFields && (
        <>
          {/* SKU & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sku" className={labelClass}>{t('skuLabel')}</label>
              <input
                {...register('sku')}
                type="text"
                id="sku"
                className={inputClass}
                placeholder={t('skuPlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="stock" className={labelClass}>{t('stockLabel')}</label>
              <input
                {...register('stock.quantity', {
                  valueAsNumber: true,
                  min: { value: 0, message: t('stockMin') }
                })}
                type="number"
                id="stock"
                className={inputClass}
                placeholder={t('stockPlaceholder')}
              />
              {errors.stock?.quantity && <p className="text-red-600 text-sm mt-1">{errors.stock.quantity.message}</p>}
            </div>
          </div>

          {/* Stock Options */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                {...register('stock.trackInventory')}
                type="checkbox"
                className="rounded"
              />
              <span className="text-sm text-gray-700">{t('trackInventory')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                {...register('stock.allowBackorder')}
                type="checkbox"
                className="rounded"
              />
              <span className="text-sm text-gray-700">{t('allowBackorder')}</span>
            </label>
          </div>

          {/* Weight */}
          <div>
            <label htmlFor="weight" className={labelClass}>{t('weightLabel')}</label>
            <input
              {...register('weight', { valueAsNumber: true })}
              type="number"
              step="0.01"
              id="weight"
              className={inputClass}
              placeholder={t('weightPlaceholder')}
            />
          </div>
        </>
      )}
    </div>
  );
}
