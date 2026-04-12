import { FC, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Page } from '../../types/page.types';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface SettingsDangerZoneProps {
  page: Page;
}

export const SettingsDangerZone: FC<SettingsDangerZoneProps> = ({ page }) => {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePage = async () => {
    if (confirmationText !== page.name) {
      return;
    }

    setIsDeleting(true);
    // TODO: Implement delete page mutation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsDeleting(false);
    // Redirect to pages list
    window.location.href = '/feed/paginas';
  };

  const isOwner = page.userRole === 'OWNER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
          Zona peligrosa
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Acciones irreversibles que afectan permanentemente a la página
        </p>
      </div>

      {/* Warning Alert */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
              Precaución
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">
              Las acciones en esta sección son permanentes y no se pueden
              deshacer. Procede con cuidado.
            </p>
          </div>
        </div>
      </div>

      {/* Transfer Ownership (Only for owners) */}
      {isOwner && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-2 border-orange-200 dark:border-orange-800">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <ArrowPathIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Transferir propiedad
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Transfiere el control completo de la página a otro
                  administrador. Esta acción es irreversible.
                </p>
                <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>
                      El nuevo propietario tendrá control total de la página
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>
                      Tu rol cambiará automáticamente a Administrador
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>No podrás revertir esta acción</span>
                  </li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg transition-colors"
            >
              Transferir
            </button>
          </div>
        </div>
      )}

      {/* Delete Page */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-2 border-red-200 dark:border-red-800">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrashIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white">
                Eliminar página
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Elimina permanentemente esta página y todo su contenido. Esta
                acción no se puede deshacer.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>
                    Se eliminarán todas las publicaciones y comentarios
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Los seguidores perderán acceso a la página</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>El nombre de usuario quedará disponible</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>No hay forma de recuperar los datos</span>
                </li>
              </ul>
            </div>
          </div>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={!isOwner}
            className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Eliminar
          </button>
        </div>
        {!isOwner && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 italic">
            Solo el propietario puede eliminar la página
          </p>
        )}
      </div>

      {/* Transfer Modal */}
      <Transition appear show={isTransferModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsTransferModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 dark:bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                      Transferir propiedad
                    </Dialog.Title>
                    <button
                      onClick={() => setIsTransferModalOpen(false)}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Esta funcionalidad estará disponible próximamente.
                    Selecciona un administrador para transferir la propiedad de
                    la página.
                  </p>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setIsTransferModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Modal */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 dark:bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                        ¿Eliminar página?
                      </Dialog.Title>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Esta acción es permanente y eliminará todo el contenido
                        de la página.
                      </p>
                    </div>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                      Se eliminarán:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-red-700 dark:text-red-400">
                      <li>• Todas las publicaciones y comentarios</li>
                      <li>• {page.stats?.followersCount || 0} seguidores</li>
                      <li>• Todas las fotos y videos</li>
                      <li>• El historial completo</li>
                    </ul>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Escribe <strong>{page.name}</strong> para confirmar:
                    </label>
                    <input
                      type="text"
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                      placeholder={page.name}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsDeleteModalOpen(false);
                        setConfirmationText('');
                      }}
                      disabled={isDeleting}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDeletePage}
                      disabled={confirmationText !== page.name || isDeleting}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      {isDeleting ? 'Eliminando...' : 'Eliminar página'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};
