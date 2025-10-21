const cheerio = require('cheerio');

const baseUrl = "https://novelight.net/book/ajax/read-chapter/";
const HEADERS = {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.8",
        "sec-ch-ua": "\"Brave\";v=\"141\", \"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"141\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Linux\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sec-gpc": "1",
        "x-requested-with": "XMLHttpRequest",
        // "cookie": "csrftoken=iG3YV5q3Qip6EhXUyno14f5NnNoZbNJi; sessionid=n1ihohadhx5abce2wc8jnj6xpwo71f8l",
        // "Referer": "https://novelight.net/book/chapter/162365"
    }

async function getChapterData(id){
    try{
        const url = `${baseUrl}${id}`;
        const response = await fetch(url, {
            "headers": HEADERS,
            "body": null,
            "method": "GET"
        })

        if(!response.ok){
            throw new Error("HTTP req error:", response.status);
        }

        const data = await response.json();
        return data;
    }
    catch (e){
        console.error("Error fetching:", e);
        return null;
    }
}

async function cleanData(data){
    if(!data) throw new Error('Chapter data not received.');
    const rawHtml = data.content;
    const c = cheerio.load(rawHtml);

    const cleanText = c('.chapter-text')
    .children('div')
    .map((i, el) => {
        const element = c(el);
        if(element.hasClass('advertisment')) return null;

        let text = element.text().trim();
        if(text === '') return null;

        return `<p>${text}</p>`;
    })
    .get().join('');

    return cleanText;
}

async function getChapter(id){
    return await getChapterData(id)
    .then(data => cleanData(data));
}

module.exports = { getChapter };