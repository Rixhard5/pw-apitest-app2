import { request, expect } from "@playwright/test";
import user from '../pw-apitest-app/.auth/user.json';
import fs from 'fs';


async function globalSetup() {
    const authFile = '.auth/user.json';
    const context = await request.newContext();

    const responseToken = await context.post("https://api.realworld.io/api/users/login", {
        data: {
            "user":{"email":"pwtest15@test.com","password":"pwtest15"}
        }
    });
    const responseBody = await responseToken.json();
    const accessToken = responseBody.user.token;
    user.origins[0].localStorage[0].value = accessToken;
    fs.writeFileSync(authFile, JSON.stringify(user));
    process.env['ACCESS_TOKEN'] = accessToken;

    const articleResponse = await context.post('https://api.realworld.io/api/articles/', {
        data: {
            "article":{"title":"Global Test titlt","description":"test desc","body":"tetet","tagList":[]}
        },
        headers: {
            Authorization: `Token ${process.env.ACCESS_TOKEN}`
        }
    });
    expect(articleResponse.status()).toEqual(201);
    const response = await articleResponse.json();
    const slugId = response.article.slug;
    process.env['SLUGID'] = slugId;
};

export default globalSetup;
