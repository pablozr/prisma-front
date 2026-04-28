import { CommonModule } from '@angular/common'
import { Component, OnInit, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ConfirmationService } from 'primeng/api'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { DialogModule } from 'primeng/dialog'
import { MultiSelectModule } from 'primeng/multiselect'
import { HeaderComponent } from '../../../global/components/header/header.component'
import {
  BreadcrumbsComponent,
  IBreadcrumbItem
} from '../../../global/components/breadcrumbs/breadcrumbs.component'
import { AppToastService } from '../../../global/services/toast/app-toast.service'
import {
  IProfessorProject,
  IProfessorCourse,
  IProfessorProjectAssignment
} from '../../interfaces/IProfessorProject'
import { ProfessorProjectsService } from '../../services/professor-projects/professor-projects.service'

@Component({
  selector: 'app-professor-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogModule, DialogModule, MultiSelectModule, HeaderComponent, BreadcrumbsComponent],
  providers: [ConfirmationService],
  templateUrl: './professor-projects.component.html',
  styleUrl: './professor-projects.component.scss'
})
export class ProfessorProjectsComponent implements OnInit {
  private projectsService = inject(ProfessorProjectsService)
  private toast = inject(AppToastService)
  private confirmationService = inject(ConfirmationService)

  readonly breadcrumbs: IBreadcrumbItem[] = [
    { label: 'Início', route: '/home', icon: 'pi pi-home' },
    { label: 'Gestão de projetos', icon: 'pi pi-briefcase' }
  ]

  projects: IProfessorProject[] = []
  courses: IProfessorCourse[] = []
  assignmentsByProjectId: Record<number, IProfessorProjectAssignment[]> = {}
  assignmentCountByProjectId: Record<number, number> = {}
  loading = true
  loadingAssignmentsByProjectId: Record<number, boolean> = {}
  assignmentsLoadedByProjectId: Record<number, boolean> = {}

  savingProjectById: Record<number, boolean> = {}
  savingLogoById: Record<number, boolean> = {}
  creatingAssignmentById: Record<number, boolean> = {}
  deletingAssignmentById: Record<number, Record<number, boolean>> = {}

  page = 1
  pageSize = 10
  totalPages = 1
  total = 0
  search = ''

  managerVisible = false
  managerProjectId: number | null = null
  showNewAssignmentFormByProjectId: Record<number, boolean> = {}

  editByProjectId: Record<
    number,
    { titulo: string; descricao_curta: string; descricao: string; image_url: string; alt_text: string }
  > = {}
  newAssignmentByProjectId: Record<number, { descricao: string; curso_ids: number[] }> = {}

  private readonly TITLE_MIN = 3
  private readonly TITLE_MAX = 255
  private readonly DESCRIPTION_MIN = 10
  private readonly DESCRIPTION_MAX = 10000
  private readonly SHORT_DESCRIPTION_MIN = 10
  private readonly SHORT_DESCRIPTION_MAX = 400
  private readonly LOGO_URL_MAX = 2048
  private readonly ALT_TEXT_MAX = 255
  private readonly ASSIGNMENT_DESCRIPTION_MIN = 10
  private readonly ASSIGNMENT_DESCRIPTION_MAX = 1000

  ngOnInit() {
    this.loadCourses()
    this.fetchProjects()
  }

  loadCourses() {
    this.projectsService.listCourses().subscribe(courses => {
      this.courses = courses
    })
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
          descricao_curta: project.short_description || '',
          descricao: project.full_description || '',
          image_url: project.cover_image_url || '',
          alt_text: project.cover_image_alt_text || ''
        }
        this.newAssignmentByProjectId[project.id] = {
          descricao: '',
          curso_ids: []
        }
        this.showNewAssignmentFormByProjectId[project.id] = false

        const assignments = this.getAssignmentsFromProject(project)
        if (assignments) {
          this.assignmentsByProjectId[project.id] = assignments
          this.assignmentCountByProjectId[project.id] = assignments.length
          this.assignmentsLoadedByProjectId[project.id] = true
          this.loadingAssignmentsByProjectId[project.id] = false
        } else {
          this.assignmentCountByProjectId[project.id] = this.assignmentCountByProjectId[project.id] || 0
        }
      }
    })
  }

  openManager(projectId: number) {
    this.managerProjectId = projectId
    this.managerVisible = true
    this.ensureAssignmentsLoaded(projectId)
  }

  closeManager() {
    this.managerVisible = false
    this.managerProjectId = null
  }

  get managerProject(): IProfessorProject | null {
    if (!this.managerProjectId) return null
    return this.projects.find(project => project.id === this.managerProjectId) || null
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
    this.loadingAssignmentsByProjectId[projectId] = true
    this.projectsService.listAssignments(projectId).subscribe(assignments => {
      this.assignmentsByProjectId[projectId] = assignments
      this.assignmentCountByProjectId[projectId] = assignments.length
      this.assignmentsLoadedByProjectId[projectId] = true
      this.loadingAssignmentsByProjectId[projectId] = false
    })
  }

  ensureAssignmentsLoaded(projectId: number) {
    if (this.assignmentsLoadedByProjectId[projectId]) return
    this.loadAssignments(projectId)
  }

  saveProject(project: IProfessorProject) {
    const edit = this.editByProjectId[project.id]
    if (!edit) return

    const titulo = edit.titulo.trim()
    const descricaoCurta = edit.descricao_curta.trim()
    const descricao = edit.descricao.trim()

    const payload: { titulo?: string; descricao?: string; descricao_curta?: string } = {}

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

    if (descricaoCurta) {
      if (descricaoCurta.length < this.SHORT_DESCRIPTION_MIN || descricaoCurta.length > this.SHORT_DESCRIPTION_MAX) {
        this.toast.warn(
          'Descricao curta invalida',
          `A descricao curta deve ter entre ${this.SHORT_DESCRIPTION_MIN} e ${this.SHORT_DESCRIPTION_MAX} caracteres.`
        )
        return
      }
      payload.descricao_curta = descricaoCurta
    }

    if (!payload.titulo && !payload.descricao && !payload.descricao_curta) {
      this.toast.warn('Nada para atualizar', 'Preencha ao menos titulo, descricao curta ou descricao completa.')
      return
    }

    this.savingProjectById[project.id] = true
    this.projectsService.updateProject(project.id, payload).subscribe({
      next: updated => {
        if (updated) {
          this.projects = this.projects.map(item => (item.id === project.id ? updated : item))
        }
        this.toast.success('Projeto atualizado', 'Dados salvos com sucesso.')
      },
      error: () => {
        this.savingProjectById[project.id] = false
      },
      complete: () => {
        this.savingProjectById[project.id] = false
      }
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

    this.savingLogoById[projectId] = true
    this.projectsService
      .updateLogo(projectId, {
        image_url: imageUrl,
        alt_text: altText || undefined
      })
      .subscribe({
        next: () => {
          this.toast.success('Logo atualizada', 'A imagem de capa foi atualizada.')
          this.editByProjectId[projectId].image_url = imageUrl
          this.editByProjectId[projectId].alt_text = altText
        },
        error: () => {
          this.savingLogoById[projectId] = false
        },
        complete: () => {
          this.savingLogoById[projectId] = false
        }
      })
  }

  createAssignment(projectId: number) {
    const draft = this.newAssignmentByProjectId[projectId]
    if (!draft) return

    const descricao = draft.descricao.trim()
    const cursoIds = Array.from(new Set(draft.curso_ids || []))

    if (descricao.length < this.ASSIGNMENT_DESCRIPTION_MIN || descricao.length > this.ASSIGNMENT_DESCRIPTION_MAX) {
      this.toast.warn(
        'Atribuicao invalida',
        `A descricao deve ter entre ${this.ASSIGNMENT_DESCRIPTION_MIN} e ${this.ASSIGNMENT_DESCRIPTION_MAX} caracteres.`
      )
      return
    }

    if (!descricao || !cursoIds.length) {
      this.toast.warn('Atribuicao invalida', 'Preencha descricao e selecione ao menos um curso.')
      return
    }

    this.creatingAssignmentById[projectId] = true
    this.projectsService.createAssignment(projectId, { descricao, curso_ids: cursoIds }).subscribe({
      next: () => {
        this.toast.success('Atribuicao criada', 'Nova atribuicao registrada com sucesso.')
        this.newAssignmentByProjectId[projectId] = { descricao: '', curso_ids: [] }
        this.showNewAssignmentFormByProjectId[projectId] = false
        this.loadAssignments(projectId)
      },
      error: () => {
        this.creatingAssignmentById[projectId] = false
      },
      complete: () => {
        this.creatingAssignmentById[projectId] = false
      }
    })
  }

  deleteAssignment(projectId: number, assignmentId: number) {
    this.confirmationService.confirm({
      header: 'Remover atribuicao',
      message: 'Deseja remover esta atribuicao? Essa acao nao pode ser desfeita.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => this.executeDeleteAssignment(projectId, assignmentId)
    })
  }

  private executeDeleteAssignment(projectId: number, assignmentId: number) {
    this.deletingAssignmentById[projectId] = this.deletingAssignmentById[projectId] || {}
    this.deletingAssignmentById[projectId][assignmentId] = true

    this.projectsService.deleteAssignment(assignmentId).subscribe({
      next: () => {
        this.toast.success('Atribuicao removida', 'A atribuicao foi desativada.')
        this.assignmentsByProjectId[projectId] = (this.assignmentsByProjectId[projectId] || []).filter(
          item => item.atribuicao_id !== assignmentId
        )
        this.assignmentCountByProjectId[projectId] = (this.assignmentsByProjectId[projectId] || []).length
      },
      error: () => {
        this.deletingAssignmentById[projectId][assignmentId] = false
      },
      complete: () => {
        this.deletingAssignmentById[projectId][assignmentId] = false
      }
    })
  }

  toggleNewAssignmentForm(projectId: number) {
    this.showNewAssignmentFormByProjectId[projectId] = !this.showNewAssignmentFormByProjectId[projectId]
  }

  isDeletingAssignment(projectId: number, assignmentId: number): boolean {
    return !!this.deletingAssignmentById[projectId]?.[assignmentId]
  }

  getProjectSummary(project: IProfessorProject): string {
    const parts: string[] = []
    if (project.process_code) parts.push(project.process_code)
    if (project.modality) parts.push(project.modality)
    if (project.weekly_hours != null) parts.push(`${project.weekly_hours}h/sem.`)
    return parts.join(' · ') || 'Sem metadados complementares'
  }

  getProjectDescription(project: IProfessorProject): string {
    return (project.short_description || project.full_description || '').trim() || 'Sem descricao cadastrada.'
  }

  getCourseNames(courseIds: number[]): string {
    if (!courseIds.length) return '-'
    const names = courseIds
      .map(courseId => this.courses.find(course => course.id === courseId)?.name || `Curso #${courseId}`)
      .filter(Boolean)
    return names.join(', ')
  }

  private getAssignmentsFromProject(project: IProfessorProject): IProfessorProjectAssignment[] | null {
    const raw = project.atribuicoes
    if (raw == null) return null

    let parsed: unknown = raw
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw)
      } catch {
        return []
      }
    }

    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item: unknown) => {
        if (!item || typeof item !== 'object') return null
        const assignment = item as Partial<IProfessorProjectAssignment>
        const courseIds = Array.isArray(assignment.curso_ids)
          ? assignment.curso_ids.filter(id => Number.isInteger(id) && id > 0)
          : []

        if (!Number.isInteger(assignment.atribuicao_id) || !Number.isInteger(assignment.projeto_id)) return null

        return {
          atribuicao_id: assignment.atribuicao_id,
          projeto_id: assignment.projeto_id,
          descricao: String(assignment.descricao || '').trim(),
          curso_ids: courseIds
        }
      })
      .filter((assignment): assignment is IProfessorProjectAssignment => !!assignment)
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
