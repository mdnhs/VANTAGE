'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, Pencil, Star, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { useProjectList } from '../../hooks/api/query/use-project-list';
import { useUpdateProject } from '../../hooks/api/mutation/use-update-project';
import { useDeleteProject } from '../../hooks/api/mutation/use-delete-project';
import { useReorderProjects } from '../../hooks/api/mutation/use-reorder-projects';
import { useToggleProjectStatus } from '../../hooks/api/mutation/use-toggle-project-status';
import type { Project } from '../../types';

interface ProjectTableProps {
  initialData: { data: Project[]; total: number };
}

const FILTERS = { page: 1, limit: 50 };

// Inline row toggle needs its own mutation instance scoped to that row's id.
function StatusToggle({ project }: { project: Project }) {
  const toggleStatus = useToggleProjectStatus(project.id);
  const isPublished = project.status === 'published';
  return (
    <div className='flex items-center gap-2'>
      <Switch
        checked={isPublished}
        disabled={toggleStatus.isPending}
        onCheckedChange={(checked) => toggleStatus.mutate(checked ? 'published' : 'draft')}
        aria-label={`${isPublished ? 'Unpublish' : 'Publish'} ${project.title}`}
      />
      <span className={cn('text-xs font-medium uppercase', isPublished ? 'text-emerald-600' : 'text-muted-foreground')}>
        {project.status}
      </span>
    </div>
  );
}

function FeaturedToggle({ project }: { project: Project }) {
  const updateProject = useUpdateProject(project.id);
  return (
    <Button
      type='button'
      variant='ghost'
      size='icon'
      className={cn('size-8', project.isFeatured ? 'text-amber-500' : 'text-muted-foreground')}
      disabled={updateProject.isPending}
      onClick={() => updateProject.mutate({ isFeatured: !project.isFeatured })}
      aria-label={project.isFeatured ? 'Unfeature' : 'Feature on homepage'}
    >
      <Star className={cn('size-4', project.isFeatured && 'fill-current')} />
    </Button>
  );
}

export function ProjectTable({ initialData }: ProjectTableProps) {
  const { data } = useProjectList(FILTERS);
  const rows = data?.data ?? initialData.data;
  const deleteProject = useDeleteProject();
  const reorderProjects = useReorderProjects();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const ids = rows.map((row) => row.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderProjects.mutate({ ids });
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    deleteProject.mutate(id, { onSettled: () => setPendingDeleteId(null) });
  };

  if (rows.length === 0) {
    return <p className='text-sm text-muted-foreground'>No projects yet. Create the first one to get started.</p>;
  }

  return (
    <div className='overflow-x-auto rounded-lg border border-border'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b border-border bg-muted/50 text-left text-muted-foreground'>
            <th className='px-4 py-2.5 font-medium'>Order</th>
            <th className='px-4 py-2.5 font-medium'>Title</th>
            <th className='px-4 py-2.5 font-medium'>Vehicle</th>
            <th className='px-4 py-2.5 font-medium'>Category</th>
            <th className='px-4 py-2.5 font-medium'>Status</th>
            <th className='px-4 py-2.5 font-medium'>Featured</th>
            <th className='px-4 py-2.5 text-right font-medium'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((project, index) => (
            <tr key={project.id} className='border-b border-border last:border-0'>
              <td className='px-4 py-2.5'>
                <div className='flex items-center gap-1'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-6'
                    disabled={index === 0 || reorderProjects.isPending}
                    onClick={() => move(index, -1)}
                    aria-label='Move up'
                  >
                    <ArrowUp className='size-3.5' />
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-6'
                    disabled={index === rows.length - 1 || reorderProjects.isPending}
                    onClick={() => move(index, 1)}
                    aria-label='Move down'
                  >
                    <ArrowDown className='size-3.5' />
                  </Button>
                </div>
              </td>
              <td className='px-4 py-2.5 font-medium'>{project.title}</td>
              <td className='px-4 py-2.5 text-muted-foreground'>{project.vehicleModel}</td>
              <td className='px-4 py-2.5 text-muted-foreground'>{project.serviceCategory}</td>
              <td className='px-4 py-2.5'>
                <StatusToggle project={project} />
              </td>
              <td className='px-4 py-2.5'>
                <FeaturedToggle project={project} />
              </td>
              <td className='px-4 py-2.5'>
                <div className='flex items-center justify-end gap-1'>
                  <Link
                    href={APP_ROUTES.content.projects.edit(project.id)}
                    aria-label={`Edit ${project.title}`}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                  >
                    <Pencil className='size-4' />
                  </Link>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-8 text-destructive hover:text-destructive'
                    disabled={pendingDeleteId === project.id}
                    onClick={() => {
                      if (window.confirm(`Delete "${project.title}"? This cannot be undone.`)) {
                        handleDelete(project.id);
                      }
                    }}
                    aria-label={`Delete ${project.title}`}
                  >
                    <Trash2 className='size-4' />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
