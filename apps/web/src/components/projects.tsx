import { Link } from '@tanstack/react-router';
import { PROJECTS, type Project } from '../lib/projects.js';
import { Page } from './page.js';

function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    if (Boolean(a.featured) === Boolean(b.featured)) {
      return a.name.localeCompare(b.name);
    }
    return a.featured ? -1 : 1;
  });
}

export function ProjectsPage() {
  const projects = sortProjects(PROJECTS);

  return (
    <Page>
      <div className='flex flex-wrap items-baseline gap-2.5'>
        <span className='text-chart-1'>perfectpan</span>
        <span className='text-muted-foreground/60'>@</span>
        <span className='text-chart-2'>blog</span>{' '}
        <span className='text-primary'>~/projects</span>
      </div>

      <div className='mt-3'>
        {projects.map((project) => (
          <div
            key={project.name}
            className='border-b border-dashed border-border py-4 last:border-b-0'
          >
            <div className='flex items-baseline justify-between gap-3'>
              <span className='text-base font-semibold text-foreground'>
                {project.name}
              </span>
              <span className='flex shrink-0 gap-3 [&_a]:text-sm [&_a]:text-primary [&_a:hover]:underline'>
                <a href={project.repo} target='_blank' rel='noreferrer'>
                  code ↗
                </a>
                {project.demo ? (
                  <a href={project.demo} target='_blank' rel='noreferrer'>
                    {project.demoLabel ?? 'demo'} ↗
                  </a>
                ) : null}
              </span>
            </div>
            <p className='mt-1 text-sm leading-relaxed text-muted-foreground'>
              {project.description}
            </p>
            <div className='mt-1.5 text-xs text-muted-foreground/60'>
              {project.tags.join(' · ')}
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}
