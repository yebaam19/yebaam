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
  return (
    <div className="space-y-4">
      {/* Name - OBLIGATORIO */}
      <div>
        <label htmlFor="name" className={labelClass}>Nombre del producto *</label>
        <input 
          {...register('name', { required: 'El nombre es requerido' })} 
          type="text" 
          id="name" 
          className={inputClass}
          placeholder="Ej: Pizza Margarita, Helado de Vainilla"
        />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
      </div>

      {/* Description - OPCIONAL pero recomendado */}
      <div>
        <label htmlFor="description" className={labelClass}>Descripción</label>
        <textarea 
          {...register('description')} 
          id="description" 
          rows={3} 
          className={inputClass}
          placeholder="Describe tu producto, ingredientes, características..."
        />
      </div>

      {/* Price - OBLIGATORIO */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className={labelClass}>Precio *</label>
          <input 
            {...register('price', { 
              required: 'El precio es requerido', 
              valueAsNumber: true, 
              min: { value: 0.01, message: 'El precio debe ser mayor a 0' } 
            })} 
            type="number" 
            step="0.01" 
            id="price" 
            className={inputClass}
            placeholder="0.00"
          />
          {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>}
        </div>
        <div>
          <label htmlFor="compareAtPrice" className={labelClass}>Precio anterior</label>
          <input 
            {...register('compareAtPrice', { 
              valueAsNumber: true, 
              min: { value: 0, message: 'Debe ser mayor a 0' } 
            })} 
            type="number" 
            step="0.01" 
            id="compareAtPrice" 
            className={inputClass} 
            placeholder="Para mostrar descuento"
          />
          {errors.compareAtPrice && <p className="text-red-600 text-sm mt-1">{errors.compareAtPrice.message}</p>}
        </div>
      </div>

      {/* Category - OPCIONAL */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="categoryMain" className={labelClass}>Categoría</label>
          <input 
            {...register('categoryMain')} 
            type="text" 
            id="categoryMain" 
            className={inputClass}
            placeholder="Ej: Pizzas, Postres, Bebidas"
          />
        </div>
        <div>
          <label htmlFor="categorySub" className={labelClass}>Subcategoría</label>
          <input 
            {...register('categorySub')} 
            type="text" 
            id="categorySub" 
            className={inputClass}
            placeholder="Ej: Clásicas, Especiales"
          />
        </div>
      </div>

      {/* Advanced Fields - Solo si se solicitan */}
      {showAdvancedFields && (
        <>
          {/* SKU & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sku" className={labelClass}>SKU / Código</label>
              <input 
                {...register('sku')} 
                type="text" 
                id="sku" 
                className={inputClass}
                placeholder="Código interno"
              />
            </div>
            <div>
              <label htmlFor="stock" className={labelClass}>Cantidad en stock</label>
              <input 
                {...register('stock.quantity', { 
                  valueAsNumber: true, 
                  min: { value: 0, message: 'No puede ser negativo' } 
                })} 
                type="number" 
                id="stock" 
                className={inputClass}
                placeholder="0 = ilimitado"
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
              <span className="text-sm text-gray-700">Rastrear inventario</span>
            </label>
            <label className="flex items-center space-x-2">
              <input 
                {...register('stock.allowBackorder')} 
                type="checkbox" 
                className="rounded"
              />
              <span className="text-sm text-gray-700">Permitir pedidos sin stock</span>
            </label>
          </div>

          {/* Weight */}
          <div>
            <label htmlFor="weight" className={labelClass}>Peso (kg)</label>
            <input 
              {...register('weight', { valueAsNumber: true })} 
              type="number" 
              step="0.01" 
              id="weight" 
              className={inputClass}
              placeholder="Para cálculo de envío"
            />
          </div>
        </>
      )}
    </div>
  );
}
