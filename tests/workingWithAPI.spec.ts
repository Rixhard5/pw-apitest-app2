import {test, expect, request} from '@playwright/test';
import tags from '../test-data/tags.json';

test.beforeEach(async ({page}) => {
  await page.route('*/**/api/tags', async route => {
    await route.fulfill({
      body: JSON.stringify(tags)
    });
  });

  await page.goto('https://angular.realworld.how/');
});

test('has title', async ({page}) => {
  await page.route('*/**/api/articles*', async route => {
    const response = await route.fetch();
    const responseBody = await response.json();
    responseBody.articles[0].title = "This is the MOCK test title.";
    responseBody.articles[0].description = "This is a MOCK test description.";

    await route.fulfill({
      body: JSON.stringify(responseBody)
    });
  });

  await page.getByText('Global Feed').click();

  await expect(page.locator('.navbar-brand')).toHaveText('conduit');

  await expect(page.locator('app-article-list h1').first()).toContainText('This is the MOCK test title.');
  await expect(page.locator('app-article-list p').first()).toContainText('This is a MOCK test description.');
});

test('delete article', async ({page, request}) => {
  const articleResponse = await request.post('https://api.realworld.io/api/articles/', {
    data: {
      "article":{"title":"Test titlt","description":"test desc","body":"tetet","tagList":[]}
    }
  });
  expect(articleResponse.status()).toEqual(201);

  await page.getByText('Global Feed').click();
  await page.getByText('Test titlt').click();
  await page.getByRole('button', {name: "Delete Article"}).first().click();
  await page.getByText('Global Feed').click();

  await expect(page.locator('app-article-list h1').first()).not.toContainText('Test titlt');

});

test('create article', async ({page, request}) => {
  await page.getByText('New Article').click();
  await page.getByRole('textbox', {name: "Article Title"}).fill('Test for deletion');
  await page.getByRole('textbox', {name: "What's this article about?"}).fill('Deletion test desc');
  await page.getByRole('textbox', {name: "Write your article (in markdown)"}).fill('Article test desc');
  await page.getByRole('button', {name: "Publish Article"}).click();
  const articleResponse = await page.waitForResponse('https://api.realworld.io/api/articles/');
  const articleResponseBody = await articleResponse.json();
  const slugId = articleResponseBody.article.slug;

  await expect(page.locator('.article-page h1')).toContainText('Test for deletion');

  await page.getByText('Home').click();
  await page.getByText('Global Feed').click();
  await expect(page.locator('app-article-list h1').first()).toContainText('Test for deletion');

  const deleteArticleResponse = await request.delete(`https://api.realworld.io/api/articles/${slugId}`);

  expect(deleteArticleResponse.status()).toEqual(204);

});
