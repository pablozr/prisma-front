import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable, delay, of } from 'rxjs'
import {
  ICourse,
  IEmailDispatch,
  IOrganizationalUnit,
  IProfessor,
  IProject,
  IProjectArea
} from '../../interfaces/IProject'

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly units: IOrganizationalUnit[] = [
    { id: 1, name: 'Centro de Ciências Exatas e Tecnologia', short_name: 'CCET', type: 'centro' },
    { id: 2, name: 'Centro de Ciências Humanas e Sociais', short_name: 'CCH', type: 'centro' },
    { id: 3, name: 'Centro de Ciências Biológicas e da Saúde', short_name: 'CCBS', type: 'centro' },
    { id: 10, name: 'Departamento de Informática Aplicada', short_name: 'DIA', type: 'departamento', parent_unit_id: 1 },
    { id: 11, name: 'Departamento de Matemática e Estatística', short_name: 'DME', type: 'departamento', parent_unit_id: 1 },
    { id: 20, name: 'Departamento de Letras', short_name: 'DL', type: 'departamento', parent_unit_id: 2 },
    { id: 21, name: 'Escola de História', short_name: 'EH', type: 'instituto', parent_unit_id: 2 },
    { id: 30, name: 'Escola de Enfermagem Alfredo Pinto', short_name: 'EEAP', type: 'instituto', parent_unit_id: 3 }
  ]

  private readonly professors: IProfessor[] = [
    { id: 1, full_name: 'Ana Paula Costa', institutional_email: 'ana.costa@unirio.br', siape: '1234567', unit_id: 10 },
    { id: 2, full_name: 'Rui Miguel Santos', institutional_email: 'rui.santos@unirio.br', siape: '2345678', unit_id: 11 },
    { id: 3, full_name: 'Marta Lopes Dias', institutional_email: 'marta.dias@unirio.br', siape: '3456789', unit_id: 20 },
    { id: 4, full_name: 'Pedro Bastos Farias', institutional_email: 'pedro.farias@unirio.br', siape: '4567890', unit_id: 21 },
    { id: 5, full_name: 'Juliana Rocha Almeida', institutional_email: 'juliana.almeida@unirio.br', siape: '5678901', unit_id: 30 },
    { id: 6, full_name: 'Carlos Eduardo Teixeira', institutional_email: 'carlos.teixeira@unirio.br', siape: '6789012', unit_id: 10 }
  ]

  private readonly courses: ICourse[] = [
    { id: 1, name: 'Sistemas de Informação', level: 'graduacao', unit_id: 10, code: 'BSI' },
    { id: 2, name: 'Ciência da Computação', level: 'graduacao', unit_id: 10, code: 'BCC' },
    { id: 3, name: 'Matemática', level: 'graduacao', unit_id: 11, code: 'MAT' },
    { id: 4, name: 'Estatística', level: 'graduacao', unit_id: 11, code: 'EST' },
    { id: 5, name: 'Letras', level: 'graduacao', unit_id: 20, code: 'LET' },
    { id: 6, name: 'História', level: 'graduacao', unit_id: 21, code: 'HIS' },
    { id: 7, name: 'Enfermagem', level: 'graduacao', unit_id: 30, code: 'ENF' },
    { id: 8, name: 'Mestrado em Informática', level: 'pos', unit_id: 10, code: 'PPGI' },
    { id: 9, name: 'Mestrado em História', level: 'pos', unit_id: 21, code: 'PPGHIS' }
  ]

  private readonly areas: IProjectArea[] = [
    { id: 1, name: 'Inteligência Artificial', slug: 'ia' },
    { id: 2, name: 'Engenharia de Software', slug: 'engenharia-software' },
    { id: 3, name: 'Educação', slug: 'educacao' },
    { id: 4, name: 'Saúde Pública', slug: 'saude-publica' },
    { id: 5, name: 'Linguística', slug: 'linguistica' },
    { id: 6, name: 'História Social', slug: 'historia-social' },
    { id: 7, name: 'Estatística Aplicada', slug: 'estatistica' },
    { id: 8, name: 'Acessibilidade', slug: 'acessibilidade' }
  ]

  private readonly projects$ = new BehaviorSubject<IProject[]>(this.buildProjects())

  listProjects(): Observable<IProject[]> {
    return this.projects$.asObservable()
  }

  listUnits(): IOrganizationalUnit[] {
    return this.units
  }

  listProfessors(): IProfessor[] {
    return this.professors
  }

  listCourses(): ICourse[] {
    return this.courses
  }

  listAreas(): IProjectArea[] {
    return this.areas
  }

  sendEmail(dispatch: IEmailDispatch): Observable<{ success: true; id: string }> {
    const id = `mock-${Date.now()}`
    return of({ success: true as const, id }).pipe(delay(800))
  }

  private buildProjects(): IProject[] {
    const now = new Date()
    const addDays = (d: number) => {
      const date = new Date(now)
      date.setDate(date.getDate() + d)
      return date.toISOString().slice(0, 10)
    }

    return [
      {
        id: 1,
        process_code: 'PIBIC-2026.1-0142',
        title: 'Assistentes conversacionais para apoio a estudantes em risco de evasão',
        short_description:
          'Desenvolvimento de agente conversacional que monitora desempenho e sugere intervenções pedagógicas.',
        full_description:
          'Projeto de iniciação científica com foco em aplicações de LLMs para identificar sinais precoces de evasão em cursos de graduação.',
        contact_email: 'ana.costa@unirio.br',
        status: 'published',
        is_active: true,
        starts_at: addDays(-10),
        ends_at: addDays(20),
        published_at: addDays(-15),
        created_at: addDays(-20),
        owner_professor: this.professors[0],
        executing_unit: this.units.find(u => u.id === 10),
        areas: [this.areas[0], this.areas[1], this.areas[2]],
        courses: [this.courses[0], this.courses[1]],
        cover: {
          id: 101,
          image_type: 'cover',
          image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=70',
          alt_text: 'Ilustração de inteligência artificial conversacional'
        },
        vacancies: 3,
        weekly_hours: 12,
        modality: 'hibrido'
      },
      {
        id: 2,
        process_code: 'PIBEX-2026.1-0087',
        title: 'Alfabetização estatística para servidores públicos',
        short_description:
          'Curso de extensão em estatística aplicada para gestores públicos municipais da Zona Norte do RJ.',
        contact_email: 'rui.santos@unirio.br',
        status: 'published',
        is_active: true,
        starts_at: addDays(-5),
        ends_at: addDays(45),
        published_at: addDays(-10),
        created_at: addDays(-12),
        owner_professor: this.professors[1],
        executing_unit: this.units.find(u => u.id === 11),
        areas: [this.areas[6], this.areas[2]],
        courses: [this.courses[3]],
        cover: {
          id: 102,
          image_type: 'cover',
          image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=70',
          alt_text: 'Gráficos de análise estatística em dashboard'
        },
        vacancies: 5,
        weekly_hours: 8,
        modality: 'remoto'
      },
      {
        id: 3,
        process_code: 'PIBIC-2026.1-0188',
        title: 'Variação linguística em comunidades quilombolas do Rio de Janeiro',
        short_description:
          'Mapeamento e análise do português vernacular em comunidades tradicionais do estado.',
        contact_email: 'marta.dias@unirio.br',
        status: 'published',
        is_active: true,
        starts_at: addDays(2),
        ends_at: addDays(60),
        published_at: addDays(-3),
        created_at: addDays(-8),
        owner_professor: this.professors[2],
        executing_unit: this.units.find(u => u.id === 20),
        areas: [this.areas[4]],
        courses: [this.courses[4]],
        cover: {
          id: 103,
          image_type: 'cover',
          image_url: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&w=1200&q=70',
          alt_text: 'Livros abertos representando pesquisa linguística'
        },
        vacancies: 2,
        weekly_hours: 10,
        modality: 'presencial'
      },
      {
        id: 4,
        process_code: 'PIBIC-2026.1-0231',
        title: 'Memórias da imigração portuguesa no Rio de Janeiro (1900-1950)',
        short_description:
          'Pesquisa em arquivos públicos e digitalização de fontes primárias sobre imigração.',
        contact_email: 'pedro.farias@unirio.br',
        status: 'published',
        is_active: true,
        starts_at: addDays(-20),
        ends_at: addDays(5),
        published_at: addDays(-25),
        created_at: addDays(-30),
        owner_professor: this.professors[3],
        executing_unit: this.units.find(u => u.id === 21),
        areas: [this.areas[5]],
        courses: [this.courses[5], this.courses[8]],
        cover: {
          id: 104,
          image_type: 'cover',
          image_url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=70',
          alt_text: 'Documentos históricos em arquivo'
        },
        vacancies: 1,
        weekly_hours: 15,
        modality: 'presencial'
      },
      {
        id: 5,
        process_code: 'PIBEX-2026.1-0304',
        title: 'Cuidados primários em saúde mental pós-pandemia',
        short_description:
          'Programa de extensão para qualificação de enfermeiros da atenção básica em saúde mental.',
        contact_email: 'juliana.almeida@unirio.br',
        status: 'published',
        is_active: true,
        starts_at: addDays(0),
        ends_at: addDays(90),
        published_at: addDays(-2),
        created_at: addDays(-4),
        owner_professor: this.professors[4],
        executing_unit: this.units.find(u => u.id === 30),
        areas: [this.areas[3]],
        courses: [this.courses[6]],
        cover: {
          id: 105,
          image_type: 'cover',
          image_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=70',
          alt_text: 'Profissionais de enfermagem em atendimento'
        },
        vacancies: 6,
        weekly_hours: 6,
        modality: 'hibrido'
      },
      {
        id: 6,
        process_code: 'PIBIC-2026.1-0412',
        title: 'Acessibilidade digital em portais acadêmicos brasileiros',
        short_description:
          'Auditoria WCAG 2.2 em 50 portais de universidades federais e proposta de guia de boas práticas.',
        contact_email: 'carlos.teixeira@unirio.br',
        status: 'published',
        is_active: true,
        starts_at: addDays(-3),
        ends_at: addDays(35),
        published_at: addDays(-6),
        created_at: addDays(-10),
        owner_professor: this.professors[5],
        executing_unit: this.units.find(u => u.id === 10),
        areas: [this.areas[7], this.areas[1]],
        courses: [this.courses[0], this.courses[1], this.courses[7]],
        cover: {
          id: 106,
          image_type: 'cover',
          image_url: 'https://images.unsplash.com/photo-1581276879432-15e50529f34b?auto=format&fit=crop&w=1200&q=70',
          alt_text: 'Tela de código com foco em acessibilidade digital'
        },
        vacancies: 4,
        weekly_hours: 12,
        modality: 'remoto'
      }
    ]
  }
}
