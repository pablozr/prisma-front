import { CommonModule } from '@angular/common'
import { Component, OnInit, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { HeaderComponent } from '../../../global/components/header/header.component'
import {
  BreadcrumbsComponent,
  IBreadcrumbItem
} from '../../../global/components/breadcrumbs/breadcrumbs.component'
import { AppToastService } from '../../../global/services/toast/app-toast.service'
import {
  IProfessorProject,
  IProfessorProjectAssignment
} from '../../interfaces/IProfessorProject'
import { ProfessorProjectsService } from '../../services/professor-projects/professor-projects.service'

@Component({
  selector: 'app-professor-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, BreadcrumbsComponent],
  templateUrl: './professor-projects.component.html',
  styleUrl: './professor-projects.component.scss'
})
export class ProfessorProjectsComponent implements OnInit {
  private projectsService = inject(ProfessorProjectsService)
  private toast = inject(AppToastService)

  readonly breadcrumbs: IBreadcrumbItem[] = [
    { label: 'Início', route: '/home', icon: 'pi pi-home' },
    { label: 'Gestão de projetos', icon: 'pi pi-briefcase' }
  ]

  projects: IProfessorProject[] = []
  assignmentsByProjectId: Record<number, IProfessorProjectAssignment[]> = {}
  loading = true

  page = 1
  pageSize = 10
  totalPages = 1
  total = 0
  search = ''

  editByProjectId: Record<number, { titulo: string; descricao: string; image_url: string; alt_text: string }> = {}
  newAssignmentByProjectId: Record<number, { descricao: string; curso_ids: string }> = {}

  private readonly TITLE_MIN = 3
  private readonly TITLE_MAX = 255
  private readonly DESCRIPTION_MIN = 10
  private readonly DESCRIPTION_MAX = 10000
  private readonly LOGO_URL_MAX = 2048
  private readonly ALT_TEXT_MAX = 255
  private readonly ASSIGNMENT_DESCRIPTION_MIN = 10
  private readonly ASSIGNMENT_DESCRIPTION_MAX = 1000

  ngOnInit() {
    this.fetchProjects()
  }

  fetchProjects() {
    this.loading = true
    this.projectsService.listMyProjects(this.page, this.pageSize, this.search).subscribe(({ projects, pagination }) => {
      this.projects = projects
      this.total = pagination.total
      this.totalPages = Math.max(1, pagination.total_pages || 1)
      this.page = pagination.page || this.page
      this.loading = false

      for (const project of projects) {
        this.editByProjectId[project.id] = {
          titulo: project.title || '',
          descricao: project.full_description || '',
          image_url: '',
          alt_text: ''
        }
        this.newAssignmentByProjectId[project.id] = {
          descricao: '',
          curso_ids: ''
        }
        this.loadAssignments(project.id)
      }
    })
  }

  onSearch() {
    this.page = 1
    this.fetchProjects()
  }

  onPageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > this.totalPages || nextPage === this.page) return
    this.page = nextPage
    this.fetchProjects()
  }

  loadAssignments(projectId: number) {
    this.projectsService.listAssignments(projectId).subscribe(assignments => {
      this.assignmentsByProjectId[projectId] = assignments
    })
  }

  saveProject(project: IProfessorProject) {
    const edit = this.editByProjectId[project.id]
    if (!edit) return

    const titulo = edit.titulo.trim()
    const descricao = edit.descricao.trim()

    const payload: { titulo?: string; descricao?: string } = {}

    if (titulo) {
      if (titulo.length < this.TITLE_MIN || titulo.length > this.TITLE_MAX) {
        this.toast.warn('Titulo invalido', `O titulo deve ter entre ${this.TITLE_MIN} e ${this.TITLE_MAX} caracteres.`)
        return
      }
      payload.titulo = titulo
    }

    if (descricao) {
      if (descricao.length < this.DESCRIPTION_MIN || descricao.length > this.DESCRIPTION_MAX) {
        this.toast.warn('Descricao invalida', `A descricao deve ter entre ${this.DESCRIPTION_MIN} e ${this.DESCRIPTION_MAX} caracteres.`)
        return
      }
      payload.descricao = descricao
    }

    if (!payload.titulo && !payload.descricao) {
      this.toast.warn('Nada para atualizar', 'Preencha ao menos titulo ou descricao.')
      return
    }

    this.projectsService.updateProject(project.id, payload).subscribe(updated => {
      if (updated) {
        this.projects = this.projects.map(item => (item.id === project.id ? updated : item))
      }
      this.toast.success('Projeto atualizado', 'Dados salvos com sucesso.')
    })
  }

  saveLogo(projectId: number) {
    const edit = this.editByProjectId[projectId]
    const imageUrl = edit?.image_url?.trim() || ''
    const altText = edit?.alt_text?.trim() || ''

    if (!imageUrl) {
      this.toast.warn('Logo invalida', 'Informe uma URL HTTP/HTTPS valida.')
      return
    }

    if (imageUrl.length > this.LOGO_URL_MAX || !this.isHttpUrl(imageUrl)) {
      this.toast.warn('Logo invalida', 'A URL da imagem deve ser HTTP/HTTPS e ter no maximo 2048 caracteres.')
      return
    }

    if (altText.length > this.ALT_TEXT_MAX) {
      this.toast.warn('Texto alternativo invalido', `O texto alternativo deve ter no maximo ${this.ALT_TEXT_MAX} caracteres.`)
      return
    }

    this.projectsService
      .updateLogo(projectId, {
        image_url: imageUrl,
        alt_text: altText || undefined
      })
      .subscribe(() => {
        this.toast.success('Logo atualizada', 'A imagem de capa foi atualizada.')
        this.editByProjectId[projectId].image_url = ''
        this.editByProjectId[projectId].alt_text = ''
      })
  }

  createAssignment(projectId: number) {
    const draft = this.newAssignmentByProjectId[projectId]
    if (!draft) return

    const descricao = draft.descricao.trim()
    const rawCursoIds = draft.curso_ids
      .split(',')
      .map(value => Number(value.trim()))
      .filter(value => Number.isInteger(value) && value > 0)

    const cursoIds = Array.from(new Set(rawCursoIds))

    if (descricao.length < this.ASSIGNMENT_DESCRIPTION_MIN || descricao.length > this.ASSIGNMENT_DESCRIPTION_MAX) {
      this.toast.warn(
        'Atribuicao invalida',
        `A descricao deve ter entre ${this.ASSIGNMENT_DESCRIPTION_MIN} e ${this.ASSIGNMENT_DESCRIPTION_MAX} caracteres.`
      )
      return
    }

    if (!descricao || !cursoIds.length) {
      this.toast.warn('Atribuicao invalida', 'Preencha descricao e IDs de curso validos.')
      return
    }

    if (cursoIds.length !== rawCursoIds.length) {
      this.toast.warn('Atribuicao invalida', 'Nao repita IDs de curso na mesma atribuicao.')
      return
    }

    this.projectsService.createAssignment(projectId, { descricao, curso_ids: cursoIds }).subscribe(() => {
      this.toast.success('Atribuicao criada', 'Nova atribuicao registrada com sucesso.')
      this.newAssignmentByProjectId[projectId] = { descricao: '', curso_ids: '' }
      this.loadAssignments(projectId)
    })
  }

  deleteAssignment(projectId: number, assignmentId: number) {
    this.projectsService.deleteAssignment(assignmentId).subscribe(() => {
      this.toast.success('Atribuicao removida', 'A atribuicao foi desativada.')
      this.assignmentsByProjectId[projectId] = (this.assignmentsByProjectId[projectId] || []).filter(
        item => item.atribuicao_id !== assignmentId
      )
    })
  }

  private isHttpUrl(value: string) {
    try {
      const parsed = new URL(value)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }
}
