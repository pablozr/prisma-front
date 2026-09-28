import { expect, test } from '@playwright/test'
import { adminUser, buildAdminApiData } from './fixtures/data'
import { installApiMock, lastRequest } from './support/mock-api'

test.describe('Authentication and route guards', () => {
  test('redirects unauthenticated visitors from admin and my-projects to signin', async ({ page }) => {
    await installApiMock(page, { session: null })

    await page.goto('/admin')
    await expect(page).toHaveURL(/\/signin$/)
    await expect(page.getByRole('heading', { name: 'Entrar no PRISMA' })).toBeVisible()

    await page.goto('/my-projects')
    await expect(page).toHaveURL(/\/signin$/)
    await expect(page.getByRole('heading', { name: 'Entrar no PRISMA' })).toBeVisible()
  })

  test('signs an administrator in through the admin tab and lands on the dashboard', async ({ page }) => {
    const mock = await installApiMock(page, {
      session: null,
      login: { 'admin@unirio.br': adminUser },
      ...buildAdminApiData()
    })

    await page.goto('/signin')
    await page.getByRole('tab', { name: 'Administrador' }).click()
    await page.locator('#email').fill('admin@unirio.br')
    await page.locator('#password').fill('senha-secreta-123')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.getByRole('heading', { name: 'Painel administrativo' })).toBeVisible()

    const loginRequest = lastRequest(mock, 'POST', '/auth/login')
    expect(loginRequest?.body).toMatchObject({ email: 'admin@unirio.br', password: 'senha-secreta-123' })
  })
})
