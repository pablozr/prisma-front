import { expect, test } from '@playwright/test'
import {
  buildManagedProject,
  catalogueFixtures,
  managedProjectTitle,
  professorUser
} from './fixtures/data'
import { installApiMock, lastRequest, waitForRequest } from './support/mock-api'

test.describe('Professor project manager', () => {
  test('lists projects, saves the description and creates then deletes an opportunity', async ({ page }) => {
    const managed = buildManagedProject()
    const mock = await installApiMock(page, {
      session: professorUser,
      managedProjects: [managed],
      ...catalogueFixtures()
    })

    await page.goto('/my-projects')

    await expect(page.getByRole('heading', { name: 'Meus projetos' })).toBeVisible()
    await expect(page.getByRole('heading', { name: managedProjectTitle })).toBeVisible()

    await page.getByRole('button', { name: 'Gerenciar' }).click()
    await expect(page.locator('#project-manager-title')).toHaveText(managedProjectTitle)

    // Save the short description (content section is the default).
    const newShortDescription = 'Nova descrição curta do projeto para divulgação pública'
    await page.locator('#project-short-description').fill(newShortDescription)
    await page.getByRole('button', { name: 'Salvar conteúdo' }).click()
    await waitForRequest(mock, 'PATCH', '/projects/7')
    expect(lastRequest(mock, 'PATCH', '/projects/7')?.body).toMatchObject({
      descricao_curta: newShortDescription
    })

    // Create an opportunity selecting the first linked course through the keyboard.
    await page.getByRole('button', { name: 'Oportunidades', exact: true }).click()
    await page.getByRole('button', { name: 'Nova oportunidade' }).click()

    const newOpportunityDescription = 'Oportunidade de iniciação científica em enfermagem'
    await page.locator('#opportunity-description').fill(newOpportunityDescription)
    const courses = page.locator('#opportunity-courses')
    await courses.press('ArrowDown')
    await courses.press('Enter')
    await courses.press('Escape')
    await page.getByRole('button', { name: 'Criar oportunidade' }).click()

    await waitForRequest(mock, 'POST', '/projects/7/opportunities')
    expect(lastRequest(mock, 'POST', '/projects/7/opportunities')?.body).toMatchObject({
      descricao: newOpportunityDescription,
      curso_ids: [30]
    })
    await expect(page.getByText('Oportunidade #101')).toBeVisible()

    // Delete the created opportunity.
    await page.getByRole('button', { name: 'Remover oportunidade' }).click()
    await page.getByRole('button', { name: 'Remover', exact: true }).click()
    await waitForRequest(mock, 'DELETE', '/opportunities/101')
    await expect(page.getByText('Oportunidade #101')).toHaveCount(0)
  })
})
