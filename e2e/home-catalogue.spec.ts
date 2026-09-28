import { expect, test } from '@playwright/test'
import { buildPublicProjects, catalogueFixtures } from './fixtures/data'
import { installApiMock, lastRequest } from './support/mock-api'

test.describe('Public portal', () => {
  test('home loads recent projects and the search forwards the term to the catalogue', async ({ page }) => {
    const projects = buildPublicProjects()
    const mock = await installApiMock(page, { publicProjects: projects, ...catalogueFixtures() })

    await page.goto('/home')

    await expect(page.getByRole('heading', { name: 'Projetos acadêmicos' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Projetos publicados' })).toBeVisible()
    await expect(page.getByRole('heading', { name: projects[0].title })).toBeVisible()
    await expect(mock.find('GET', '/projects').length).toBeGreaterThan(0)

    await page.getByLabel('Buscar no catálogo').fill('Saúde')
    await page.getByRole('button', { name: 'Buscar' }).click()

    await expect(page).toHaveURL(/\/catalogo\?q=Sa/)
    await expect(page.getByRole('searchbox', { name: 'Buscar projetos' })).toHaveValue('Saúde')
    await expect
      .poll(() => mock.find('GET', '/projects').some(request => request.query.get('q') === 'Saúde'))
      .toBeTruthy()
    await expect(page.getByRole('heading', { name: 'Saúde coletiva e promoção da cidadania' })).toBeVisible()
  })

  test('home shows a retry notice when the projects request fails and recovers afterwards', async ({ page }) => {
    const projects = buildPublicProjects()
    await installApiMock(page, { publicProjects: projects, projectListFailures: 1 })

    await page.goto('/home')

    await expect(page.getByText('Consulta temporariamente indisponível')).toBeVisible()
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('heading', { name: projects[0].title })).toBeVisible()
  })

  test('catalogue searches, sorts and opens the project details', async ({ page }) => {
    const projects = buildPublicProjects()
    const mock = await installApiMock(page, { publicProjects: projects, ...catalogueFixtures() })

    await page.goto('/catalogo')
    await expect(page.getByRole('heading', { name: 'Projetos da UNIRIO' })).toBeVisible()

    const search = page.getByRole('searchbox', { name: 'Buscar projetos' })
    await search.fill('Biodiversidade')
    await expect
      .poll(() => mock.find('GET', '/projects').some(request => request.query.get('q') === 'Biodiversidade'))
      .toBeTruthy()

    const biodiversity = 'Biodiversidade da restinga de Maricá'
    await expect(page.getByRole('heading', { name: biodiversity })).toBeVisible()
    await expect(page.getByRole('heading', { name: projects[0].title })).toHaveCount(0)

    await page.getByRole('button', { name: 'A-Z' }).click()
    await expect
      .poll(() => mock.find('GET', '/projects').some(request => request.query.get('ordenacao') === 'titulo_asc'))
      .toBeTruthy()

    await page.getByRole('button', { name: `Ver projeto ${biodiversity}` }).click()
    await expect(page.locator('#project-details-title')).toHaveText(biodiversity)
    await expect(page.getByRole('heading', { name: 'Informações gerais' })).toBeVisible()

    const details = lastRequest(mock, 'GET', '/projects/2')
    expect(details).toBeTruthy()
  })

  test('catalogue exposes an empty state when the search has no results', async ({ page }) => {
    const projects = buildPublicProjects()
    await installApiMock(page, { publicProjects: projects, ...catalogueFixtures() })

    await page.goto('/catalogo')
    await page.getByRole('searchbox', { name: 'Buscar projetos' }).fill('termo-inexistente-xyz')

    await expect(page.getByText('Nenhum projeto encontrado')).toBeVisible()
    await page.getByRole('button', { name: 'Limpar filtros' }).click()
    await expect(page.getByRole('heading', { name: projects[0].title })).toBeVisible()
  })

  test('catalogue shows a retry state when the projects request fails and recovers afterwards', async ({ page }) => {
    const projects = buildPublicProjects()
    await installApiMock(page, { publicProjects: projects, ...catalogueFixtures(), projectListFailures: 1 })

    await page.goto('/catalogo')

    await expect(page.getByText('Não foi possível carregar os projetos')).toBeVisible()
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('heading', { name: projects[0].title })).toBeVisible()
  })
})
