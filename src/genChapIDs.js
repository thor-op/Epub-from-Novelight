const cheerio = require('cheerio');

const HEADERS = {
        "accept": "*/*",
        "sec-ch-ua": "\"Brave\";v=\"141\", \"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"141\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Linux\"",
        "x-requested-with": "XMLHttpRequest"
    }

// async function getPageCount(url){
//     const html = await fetch(url)
//     .then(data => data.text());
//     const $ = cheerio.load(html);
//     return $('select#select-pagination-chapter').children().length;
// }

async function getSelectorHTML(url){
    try{
        const response = await fetch(url, {
            "headers": HEADERS,
            "body": null,
            "method": "GET"
        })

        if(!response.ok){
            throw new Error("HTTP req error:", response.status);
        }

        const selectorHTMLinJSON = await response.json();
        return selectorHTMLinJSON.html;
    }
    catch (e){
        console.error("Error fetching:", e);
        return null;
    }
}

function processHTML(selectorHTML){
    try{
        const $ = cheerio.load(selectorHTML);

        const ArrOfLinkObj = $('a')
        .map((i, el) => {
            const element = $(el);

            // dont process paid chapters
            if(element.find('.chapter-info > .cost').length) return null;

            // Create an object for each link's data containing id, chapter number and title
            
            // Get the text inside div(child of anchor) containing title class, trim it and capture required stuff(in [])
            // "1 chapter - This Contempt Feels Familiar (1)" -> "[1] chapter - [This Contempt Feels Familiar (1)]"
            const chapterMatch = element.children('.title')?.text().trim().match(/(\d*) chapter - (.*)/);
            if(!chapterMatch)
                throw new Error(`Match pattern not found for element ${element.children('.title')?.html()} at index ${i}`);
            const obj = {
                // Extract 162365 from /book/chapter/162365 and store it as the linkID
                linkID: element.prop('href').match(/\d+/)[0],

                chapter: chapterMatch[1],
                title: chapterMatch[2]
            };

            return obj;
        }).get().reverse();
        return ArrOfLinkObj;
    }
    catch(e){
        console.error("Error processing:", e);
        return null;
    }
}
async function getChapterIDsJSON(options = {}){
    const baseUrl = `https://novelight.net/book/ajax/chapter-pagination?&book_id=${options.metadata.novelID}&page=`

    const arrID = [];
    let chapters = 0;
    let br = false;

    for(let i = options.metadata.pageCount; i >= 1; i--){
        if(br) break;
        const URL = `${baseUrl}${i}`;

        await getSelectorHTML(URL)
        .then(selectorHTML => processHTML(selectorHTML))
        .then(arr => {
            const arrBegin = chapters;
            chapters += arr.length;
            const arrEnd = chapters;

            if(options.start == null && options.end == null) arrID.push(...arr);
            else if(options.start == null){
                if(arrEnd <= options.end) arrID.push(...arr);
                else if(arrBegin < options.end){
                    arrID.push(...arr.slice(0, options.end-arrBegin));
                    br = true; return;
                }
                else { br = true; return; }
            }
            else if(options.end == null){
                if(arrEnd < options.start) return;
                if(options.start <= arrBegin) arrID.push(...arr);
                else arrID.push(...arr.slice(options.start - arrBegin-1));
            }
            else{
                if(arrEnd < options.start) return; // before start
                if(arrBegin > options.end) {br = true; return} // after end
                if(options.start <= arrBegin && arrEnd < options.end) arrID.push(...arr); // both start and end not in the current array
                else if(options.start <= arrBegin){ // end in current array
                    arrID.push(...arr.slice(0, options.end-arrBegin))
                    br = true; return;
                }
                else if(arrEnd < options.end) arrID.push(...arr.slice(options.start - arrBegin-1)); // start in current array
                else arrID.push(...arr.slice(options.start - arrBegin-1, options.end-arrBegin)); // both in current array

            }
        });
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    return arrID;
}

module.exports = { getChapterIDsJSON };