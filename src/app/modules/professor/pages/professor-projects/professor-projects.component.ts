import { CommonModule } from '@angular/common'
import { Component, OnInit, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ConfirmationService } from 'primeng/api'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { DialogModule } from 'primeng/dialog'
import { MultiSelectModule } from 'primeng/multiselect'
import { BreadcrumbsComponent, IBreadcrumbItem } from '../../../global/components/breadcrumbs/breadcrumbs.component'
import { HeaderComponent } from '../../../global/components/header/header.component'
import { AppToastService } from '../../../global/services/toast/app-toast.service'
import { IManagedProject, IProfessorCourse } from '../../interfaces/IProfessorProject'
import { ProfessorProjectsService } from '../../services/professor-projects/professor-projects.service'

interface IProjectEdit {
  descricao_curta: string
  descricao: string
  original_descricao_curta: string
  original_descricao: string
  image_url: string
  alt_text: string
  image_file: File | null
  preview_url: string
}

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
    { label: 'Meus projetos', icon: 'pi pi-briefcase' }
  ]

  projects: IManagedProject[] = []
  managerProject: IManagedProject | null = null
  loading = true
  loadingProject = false
  savingProject = false
  savingLogo = false
  creatingOpportunity = false
  deletingOpportunityId: number | null = null

  page = 1
  pageSize = 10
  totalPages = 1
  total = 0
  search = ''
  managerVisible = false
  showNewOpportunityForm = false
  edit: IProjectEdit | null = null
  newOpportunity = { descricao: '', curso_ids: [] as number[] }
  private previewObjectUrl: string | null = null

  private readonly DESCRIPTION_MIN = 10
  private readonly DESCRIPTION_MAX = 10000
  private readonly SHORT_DESCRIPTION_MIN = 10
  private readonly SHORT_DESCRIPTION_MAX = 400
  private readonly LOGO_MAX_BYTES = 5 * 1024 * 1024
  private readonly LOGO_ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
  private readonly ALT_TEXT_MAX = 255
  private readonly OPPORTUNITY_DESCRIPTION_MIN = 10
  private readonly OPPORTUNITY_DESCRIPTION_MAX = 1000

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
    })
  }

  openManager(projectId: number) {
    this.managerVisible = true
    this.loadingProject = true
    this.managerProject = null
    this.edit = null
    this.showNewOpportunityForm = false
    this.projectsService.getMyProject(projectId).subscribe(project => {
      this.loadingProject = false
      if (!project) {
        this.closeManager()
        return
      }
      this.managerProject = project
      this.edit = this.buildEdit(project)
      this.newOpportunity = { descricao: '', curso_ids: [] }
    })
  }

  closeManager() {
    this.managerVisible = false
    this.managerProject = null
    this.edit = null
    this.showNewOpportunityForm = false
    this.clearPreviewObjectUrl()
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

  saveProject() {
    if (!this.managerProject || !this.edit) return

    const descricaoCurta = this.edit.descricao_curta.trim()
    const descricao = this.edit.descricao.trim()
    const payload: { descricao?: string | null; descricao_curta?: string | null } = {}

    if (descricao !== this.edit.original_descricao) {
      if (descricao && !this.isDescriptionValid(descricao, this.DESCRIPTION_MIN, this.DESCRIPTION_MAX, 'Descricao')) return
      payload.descricao = descricao || null
    }

    if (descricaoCurta !== this.edit.original_descricao_curta) {
      if (descricaoCurta && !this.isDescriptionValid(descricaoCurta, this.SHORT_DESCRIPTION_MIN, this.SHORT_DESCRIPTION_MAX, 'Descricao curta')) return
      payload.descricao_curta = descricaoCurta || null
    }

    if (!Object.keys(payload).length) {
      this.toast.warn('Nada para atualizar', 'Altere ou limpe uma descrição para salvar.')
      return
    }

    this.savingProject = true
    this.projectsService.updateProject(this.managerProject.id, payload).subscribe({
      next: updated => {
        if (!this.managerProject || !this.edit) return
        this.managerProject = {
          ...this.managerProject,
          editorial: {
            ...this.managerProject.editorial,
            short_description: updated.short_description,
            description: updated.full_description
          }
        }
        this.edit = this.buildEdit(this.managerProject)
        this.projects = this.projects.map(project =>
          project.id === this.managerProject?.id ? this.managerProject : project
        )
        this.toast.success('Projeto atualizado', 'Conteúdo editorial salvo com sucesso.')
      },
      error: () => (this.savingProject = false),
      complete: () => (this.savingProject = false)
    })
  }

  saveLogo() {
    if (!this.managerProject || !this.edit) return
    const altText = this.edit.alt_text.trim()
    if (!this.edit.image_file) {
      this.toast.warn('Logo invalida', 'Selecione uma imagem para enviar.')
      return
    }
    if (altText.length > this.ALT_TEXT_MAX) {
      this.toast.warn('Texto alternativo invalido', `O texto alternativo deve ter no maximo ${this.ALT_TEXT_MAX} caracteres.`)
      return
    }

    this.savingLogo = true
    this.projectsService.updateLogo(this.managerProject.id, this.edit.image_file, altText || undefined).subscribe({
      next: logo => {
        if (!this.managerProject || !this.edit) return
        this.managerProject = {
          ...this.managerProject,
          editorial: { ...this.managerProject.editorial, cover: { id: logo.projeto_id, image_url: logo.image_url, alt_text: logo.alt_text } }
        }
        this.edit.image_url = logo.image_url
        this.edit.preview_url = logo.image_url
        this.edit.alt_text = logo.alt_text || ''
        this.edit.image_file = null
        this.clearPreviewObjectUrl()
        this.projects = this.projects.map(project => project.id === this.managerProject?.id ? this.managerProject : project)
        this.toast.success('Logo atualizada', 'A imagem de capa foi atualizada.')
      },
      error: () => (this.savingLogo = false),
      complete: () => (this.savingLogo = false)
    })
  }

  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0] || null
    if (!this.edit || !file) return
    if (!this.LOGO_ALLOWED_TYPES.has(file.type)) {
      this.toast.warn('Logo invalida', 'Use uma imagem JPG, PNG, WEBP ou GIF.')
      input.value = ''
      return
    }
    if (file.size > this.LOGO_MAX_BYTES) {
      this.toast.warn('Logo invalida', 'A imagem deve ter no maximo 5MB.')
      input.value = ''
      return
    }

    this.clearPreviewObjectUrl()
    this.previewObjectUrl = URL.createObjectURL(file)
    this.edit.image_file = file
    this.edit.preview_url = this.previewObjectUrl
  }

  createOpportunity() {
    if (!this.managerProject) return
    const descricao = this.newOpportunity.descricao.trim()
    const cursoIds = Array.from(new Set(this.newOpportunity.curso_ids))
    if (!this.isDescriptionValid(descricao, this.OPPORTUNITY_DESCRIPTION_MIN, this.OPPORTUNITY_DESCRIPTION_MAX, 'Oportunidade')) return
    if (!cursoIds.length) {
      this.toast.warn('Oportunidade invalida', 'Selecione ao menos um curso do projeto.')
      return
    }

    this.creatingOpportunity = true
    this.projectsService.createOpportunity(this.managerProject.id, { descricao, curso_ids: cursoIds }).subscribe({
      next: opportunity => {
        if (!this.managerProject) return
        this.managerProject = { ...this.managerProject, opportunities: [...this.managerProject.opportunities, opportunity] }
        this.projects = this.projects.map(project => project.id === this.managerProject?.id ? this.managerProject : project)
        this.newOpportunity = { descricao: '', curso_ids: [] }
        this.showNewOpportunityForm = false
        this.toast.success('Oportunidade criada', 'Nova oportunidade registrada com sucesso.')
      },
      error: () => (this.creatingOpportunity = false),
      complete: () => (this.creatingOpportunity = false)
    })
  }

  deleteOpportunity(opportunityId: number) {
    this.confirmationService.confirm({
      header: 'Remover oportunidade',
      message: 'Deseja remover esta oportunidade? Essa acao nao pode ser desfeita.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => this.executeDeleteOpportunity(opportunityId)
    })
  }

  getProjectSummary(project: IManagedProject): string {
    return [project.process_code, project.institutional.type, project.institutional.status].filter(Boolean).join(' · ') || 'Sem metadados institucionais'
  }

  getProjectDescription(project: IManagedProject): string {
    return project.editorial.short_description || project.editorial.description || project.institutional.summary || 'Sem descrição disponível.'
  }

  getCourseNames(courses: IProfessorCourse[]): string {
    return courses.map(course => course.name).join(', ') || '-'
  }

  private buildEdit(project: IManagedProject): IProjectEdit {
    const shortDescription = project.editorial.short_description || ''
    const description = project.editorial.description || ''
    const cover = project.editorial.cover
    return {
      descricao_curta: shortDescription,
      descricao: description,
      original_descricao_curta: shortDescription,
      original_descricao: description,
      image_url: cover?.image_url || '',
      alt_text: cover?.alt_text || '',
      image_file: null,
      preview_url: cover?.image_url || ''
    }
  }

  private executeDeleteOpportunity(opportunityId: number) {
    if (!this.managerProject) return
    this.deletingOpportunityId = opportunityId
    this.projectsService.deleteOpportunity(opportunityId).subscribe({
      next: () => {
        if (!this.managerProject) return
        this.managerProject = {
          ...this.managerProject,
          opportunities: this.managerProject.opportunities.filter(opportunity => opportunity.id !== opportunityId)
        }
        this.projects = this.projects.map(project => project.id === this.managerProject?.id ? this.managerProject : project)
        this.toast.success('Oportunidade removida', 'A oportunidade foi desativada.')
      },
      error: () => (this.deletingOpportunityId = null),
      complete: () => (this.deletingOpportunityId = null)
    })
  }

  private isDescriptionValid(value: string, min: number, max: number, label: string): boolean {
    if (value.length >= min && value.length <= max) return true
    this.toast.warn(`${label} invalida`, `A descrição deve ter entre ${min} e ${max} caracteres.`)
    return false
  }

  private clearPreviewObjectUrl() {
    if (!this.previewObjectUrl) return
    URL.revokeObjectURL(this.previewObjectUrl)
    this.previewObjectUrl = null
  }
}
