'use client'

/**
 * ProjectsManager Component
 *
 * Componente para gestionar proyectos del portafolio
 * Feature flag: SERVICES_PROJECTS_PORTFOLIO
 */

import ButtonPrimary from '@/ui/ButtonPrimary'
import ButtonSecondary from '@/ui/ButtonSecondary'
import Input from '@/ui/Input'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import {
  CodeBracketIcon,
  LinkIcon,
  PencilIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@/components/icons/heroicons-shim'
import { Fragment, useCallback, useState } from 'react'
import type { PortfolioProject } from '../../interfaces/professional-service.interfaces'

interface ProjectsManagerProps {
  projects: PortfolioProject[]
  onChange: (projects: PortfolioProject[]) => void
}

export function ProjectsManager({ projects, onChange }: ProjectsManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [currentProject, setCurrentProject] = useState<PortfolioProject>({
    title: '',
    description: '',
    url: '',
    githubUrl: '',
    imageUrl: '',
    technologies: [],
    startDate: '',
    endDate: '',
  })
  const [techInput, setTechInput] = useState('')

  // Abrir modal para agregar
  const handleAdd = useCallback(() => {
    setCurrentProject({
      title: '',
      description: '',
      url: '',
      githubUrl: '',
      imageUrl: '',
      technologies: [],
      startDate: '',
      endDate: '',
    })
    setEditingIndex(null)
    setIsModalOpen(true)
  }, [])

  // Abrir modal para editar
  const handleEdit = useCallback(
    (index: number) => {
      setCurrentProject({ ...projects[index] })
      setEditingIndex(index)
      setIsModalOpen(true)
    },
    [projects]
  )

  // Guardar proyecto
  const handleSave = useCallback(() => {
    if (!currentProject.title.trim()) {
      return
    }

    const newProjects = [...projects]
    if (editingIndex !== null) {
      // Editar existente
      newProjects[editingIndex] = currentProject
    } else {
      // Agregar nuevo
      newProjects.push(currentProject)
    }

    onChange(newProjects)
    setIsModalOpen(false)
  }, [currentProject, editingIndex, projects, onChange])

  // Eliminar proyecto
  const handleDelete = useCallback(
    (index: number) => {
      const newProjects = projects.filter((_, i) => i !== index)
      onChange(newProjects)
    },
    [projects, onChange]
  )

  // Agregar tecnología
  const handleAddTech = useCallback(() => {
    if (techInput.trim() && !currentProject.technologies?.includes(techInput.trim())) {
      setCurrentProject({
        ...currentProject,
        technologies: [...(currentProject.technologies || []), techInput.trim()],
      })
      setTechInput('')
    }
  }, [techInput, currentProject])

  // Eliminar tecnología
  const handleRemoveTech = useCallback(
    (tech: string) => {
      setCurrentProject({
        ...currentProject,
        technologies: currentProject.technologies?.filter((t) => t !== tech) || [],
      })
    },
    [currentProject]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Portafolio de Proyectos</h3>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            Muestra los proyectos en los que has trabajado
          </p>
        </div>
        <ButtonPrimary className="px-4 py-2 text-sm" onClick={handleAdd}>
          <PlusIcon className="h-4 w-4" />
          <span className="ml-2">Agregar Proyecto</span>
        </ButtonPrimary>
      </div>

      {/* Lista de proyectos */}
      {projects.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center dark:border-neutral-700 dark:bg-neutral-800/50">
          <CodeBracketIcon className="mx-auto h-12 w-12 text-neutral-400" />
          <p className="mt-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">No hay proyectos aún</p>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            Agrega proyectos para mostrar tu experiencia
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project, index) => (
            <div
              key={index}
              className="group rounded-lg border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="flex gap-4">
                {/* Imagen del proyecto */}
                {project.imageUrl ? (
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                    <img src={project.imageUrl} alt={project.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-700">
                    <PhotoIcon className="h-8 w-8 text-neutral-400" />
                  </div>
                )}

                {/* Contenido */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">{project.title}</h4>
                      {project.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                          {project.description}
                        </p>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleEdit(index)}
                        className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tecnologías */}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {project.technologies.map((tech, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Enlaces */}
                  <div className="flex gap-3 text-xs">
                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary-600 hover:underline dark:text-primary-400"
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                        <span>Ver proyecto</span>
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-neutral-600 hover:underline dark:text-neutral-400"
                      >
                        <CodeBracketIcon className="h-3.5 w-3.5" />
                        <span>GitHub</span>
                      </a>
                    )}
                  </div>

                  {/* Fechas */}
                  {(project.startDate || project.endDate) && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">
                      {project.startDate &&
                        new Date(project.startDate).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                      {project.startDate && project.endDate && ' - '}
                      {project.endDate
                        ? new Date(project.endDate).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
                        : project.startDate && 'Presente'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de edición */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all dark:bg-neutral-900">
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-neutral-200 pb-4 dark:border-neutral-700">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        {editingIndex !== null ? 'Editar Proyecto' : 'Agregar Proyecto'}
                      </h3>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        Completa la información del proyecto
                      </p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Form */}
                  <div className="mt-6 space-y-4">
                    {/* Título */}
                    <div>
                      <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Título del proyecto <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={currentProject.title}
                        onChange={(e) => setCurrentProject({ ...currentProject, title: e.target.value })}
                        placeholder="Ej: Plataforma de E-commerce"
                        className="mt-1.5"
                      />
                    </div>

                    {/* Descripción */}
                    <div>
                      <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Descripción</label>
                      <textarea
                        value={currentProject.description || ''}
                        onChange={(e) => setCurrentProject({ ...currentProject, description: e.target.value })}
                        placeholder="Describe brevemente el proyecto..."
                        rows={3}
                        className="mt-1.5 block w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                      />
                    </div>

                    {/* URLs */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          URL del proyecto
                        </label>
                        <Input
                          type="url"
                          value={currentProject.url || ''}
                          onChange={(e) => setCurrentProject({ ...currentProject, url: e.target.value })}
                          placeholder="https://..."
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          URL de GitHub
                        </label>
                        <Input
                          type="url"
                          value={currentProject.githubUrl || ''}
                          onChange={(e) => setCurrentProject({ ...currentProject, githubUrl: e.target.value })}
                          placeholder="https://github.com/..."
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    {/* Imagen */}
                    <div>
                      <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        URL de imagen
                      </label>
                      <Input
                        type="url"
                        value={currentProject.imageUrl || ''}
                        onChange={(e) => setCurrentProject({ ...currentProject, imageUrl: e.target.value })}
                        placeholder="https://..."
                        className="mt-1.5"
                      />
                      {currentProject.imageUrl && (
                        <div className="mt-2">
                          <img
                            src={currentProject.imageUrl}
                            alt="Preview"
                            className="h-24 w-24 rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Tecnologías */}
                    <div>
                      <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Tecnologías</label>
                      <div className="mt-1.5 flex gap-2">
                        <Input
                          type="text"
                          value={techInput}
                          onChange={(e) => setTechInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddTech()
                            }
                          }}
                          placeholder="Ej: React, Node.js, MongoDB"
                        />
                        <ButtonSecondary type="button" className="px-4 py-2.5" onClick={handleAddTech}>
                          Agregar
                        </ButtonSecondary>
                      </div>
                      {currentProject.technologies && currentProject.technologies.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {currentProject.technologies.map((tech, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                            >
                              {tech}
                              <button
                                type="button"
                                onClick={() => handleRemoveTech(tech)}
                                className="hover:text-primary-900 dark:hover:text-primary-200"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fechas */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          Fecha de inicio
                        </label>
                        <Input
                          type="month"
                          value={currentProject.startDate || ''}
                          onChange={(e) => setCurrentProject({ ...currentProject, startDate: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          Fecha de fin
                        </label>
                        <Input
                          type="month"
                          value={currentProject.endDate || ''}
                          onChange={(e) => setCurrentProject({ ...currentProject, endDate: e.target.value })}
                          className="mt-1.5"
                          placeholder="Dejar vacío si está en curso"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-6 flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
                    <ButtonSecondary onClick={() => setIsModalOpen(false)}>Cancelar</ButtonSecondary>
                    <ButtonPrimary onClick={handleSave} disabled={!currentProject.title.trim()}>
                      {editingIndex !== null ? 'Guardar cambios' : 'Agregar proyecto'}
                    </ButtonPrimary>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}
