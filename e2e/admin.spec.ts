import { expect, test } from '@playwright/test'
import { adminUser, buildAdminApiData, buildAdminProjects } from './fixtures/data'
import { installApiMock, lastRequest, waitForRequest } from './support/mock-api'

test.describe('Admin dashboard', () => {
  test('renders metrics, searches, updates a user and a project, and drills into sync failures', async ({ page }) => {
    const adminProject = buildAdminProjects()[0]
    const mock = await installApiMock(page, {
      session: adminUser,
      ...buildAdminApiData()
    })

    await page.goto('/admin')

    await expect(page.getByRole('heading', { name: 'Painel administrativo' })).toBeVisible()
    await expect(page.getByText('Total de projetos')).toBeVisible()
    await expect(page.getByText('1.234')).toBeVisible()
    await expect(page.getByText('Maria Docente')).toBeVisible()

    // Search users.
    await page.getByLabel('Buscar usuários por nome ou e-mail').fill('Maria')
    await page.getByLabel('Buscar usuários por nome ou e-mail').press('Enter')
    await expect
      .poll(() => mock.find('GET', '/admin/users').some(request => request.query.get('q') === 'Maria'))
      .toBeTruthy()

    // Toggle user activation and save.
    const userRow = page.getByRole('row', { name: /Maria Docente/ })
    await userRow.getByRole('checkbox').click()
    await userRow.getByRole('button', { name: 'Salvar' }).click()
    await waitForRequest(mock, 'PATCH', '/admin/users/2')
    expect(lastRequest(mock, 'PATCH', '/admin/users/2')?.body).toMatchObject({
      role: 'professor',
      is_active: false
    })

    // Projects tab: toggle catalogue visibility and save.
    await page.getByRole('tab', { name: 'Projetos' }).click()
    const projectRow = page.getByRole('row', { name: new RegExp(adminProject.title) })
    await expect(projectRow).toBeVisible()
    await projectRow.getByRole('checkbox').click()
    await projectRow.getByRole('button', { name: 'Salvar' }).click()
    await waitForRequest(mock, 'PATCH', '/admin/projects/7')
    expect(lastRequest(mock, 'PATCH', '/admin/projects/7')?.body).toMatchObject({
      publication_status: 'published',
      is_visible: false
    })

    // Sync runs tab: open failure details.
    await page.getByRole('tab', { name: 'Sincronizações' }).click()
    await expect(page.getByRole('cell', { name: '#1' })).toBeVisible()
    await page.getByRole('button', { name: 'Ver detalhes' }).click()
    await expect(page.getByText('Falhas da execução #1')).toBeVisible()
    await expect(page.getByText('Registro 42 inválido: campo obrigatório ausente')).toBeVisible()
  })
})
