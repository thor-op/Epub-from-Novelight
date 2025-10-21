#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const epub = require('epub-gen-memory').default;
const cheerio = require('cheerio');
const { input, number, confirm, editor } = require("@inquirer/prompts");

const { getChapterIDsJSON } = require(path.join(__dirname, 'genChapIDs.js'));
const { getChapter } = require(path.join(__dirname, 'getChapter.js'));
const { transformToc } = require(path.join(__dirname, 'transformTOC.js'));


async function fileExists(filePath){
    try{
        await fs.access(filePath, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

function getMetadata(html){
    try{
        const metadata = {};
        const $ = cheerio.load(html);

        metadata.novelID = $('script')
        .filter((i, el) => $(el).text().trim().includes('const OBJECT_BY_COMMENT'))
        .html().match(/const OBJECT_BY_COMMENT = (\d+)/)[1];
        
        metadata.title = $('header.header-manga .container h1').text()
        .match(/^(.+?)(?:\s*\((?=light novel|novel)[^)]*\))?$/i)?.[1] ?? "Couldn't get title.";
        // Get the title without (light novel) or (novel), but accept other terms in parenthesis.
    
        metadata.author = $('a[href^=/character] .info').text().trim();
    
        metadata.coverUrl = "https://novelight.net" + $('div.poster img').attr('src');
    
        metadata.description = $('section.text-info').first().text().trim();

        metadata.pageCount = $('select#select-pagination-chapter').children().length;

        return metadata;
    } catch(e){
        console.error("Error getting book metadata", e);
    }
}

async function genNovel(config){
    const tempDir = path.join(path.dirname(__dirname), `tempFiles-${config.metadata.novelID}`);
    if(!await fileExists(tempDir)) await fs.mkdir(tempDir);

    // Get Chapter metadata
    if(!await fileExists(path.join(tempDir, 'all-chap-ids.json')) || config.regen){
        console.log("Fetching chapter ids", '\r\x1b[1A');
        const arrID = await getChapterIDsJSON(config);
        await fs.writeFile(path.join(tempDir, 'all-chap-ids.json'), JSON.stringify(arrID, null, 2));
    }

    const chapIDs = JSON.parse(await fs.readFile(path.join(tempDir, 'all-chap-ids.json')));

    // Get Chapters
    const chapterDir = path.join(tempDir, 'chapters');
    if(!await fileExists(chapterDir))
    await fs.mkdir(chapterDir, {recursive: true});

    const chapters = [];
    for(ch of chapIDs){
        const chapterPath = path.join(chapterDir, `chap${ch.chapter}.txt`);

        try{
            if(!await fileExists(chapterPath)){
                console.log(`Fetching chapter ${ch.chapter}`, '\r\x1b[1A')
                await fs.writeFile(chapterPath , await getChapter(ch.linkID));
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        } catch(e){
            console.error(`Error fetching chapter ${ch.chapter}`);
        }

        const chapter = {
            title: `Chapter ${ch.chapter} - ${ch.title}`,
            content: await fs.readFile(chapterPath, 'utf-8')
        }
        chapters.push(chapter);
        if(chapters.length == config.end-config.start+1) break;
    }

    // Generate the epub
    try{
        const content = await epub({
            title: config.title ?? "",
            cover: config.cover ?? "",
            author: config.author ?? "",
            publisher: config.publisher ?? "",
            description: config.description ?? "",
            tocTitle: config.tocTitle ?? "",
            numberChaptersInTOC: false,
            lang: config.lang || ""
        }, chapters);
        console.log("Ebook written successfully.");
        const eBookPath = path.join(path.dirname(__dirname), `${config.name || tempDir}.epub`);
        await fs.writeFile(eBookPath, content);

        transformToc(eBookPath, config.chunks);
        // not used ?? cuz ?? allows empty string, but names cant be empty
    } catch(e){
        console.error("Error making epub:", e);
    }
    // Delete temporary files
    if(config.deleteTemp)
    await fs.rm(tempDir, {recursive: true, force: true});
}

async function main() {
  let config = {};
  try{
  config.url = await input({
    message: "Provide url of the novel",
    default:
      "https://novelight.net/book/the-regressed-mercenarys-machinations",
    required: true,
    validate: async (value) => {
      if (value.match(/^https:\/\/novelight.net\/book\//)){
        const res = await fetch(value);
        if(!res.ok) return "Please provide a valid homepage url. Eg: https://novelight.net/book/the-regressed-mercenarys-machinations";

        const html = await res.text();
        config.metadata = getMetadata(html);

        return true;
      }
      else return "Please provide a url from novelight.net site.";
    },
  });
  
  config.start = await number({
    message: "Enter first chapter",
    default: 1,
    min: 1,
    max: Infinity,
    required: true,
  });

  config = {
    ...config,
    end: await number({
      message: "Enter last chapter",
      min: config.start,
      max: Infinity,
    }),

    title: await input({
      message: "Title of the book",
      default: config.metadata.title,
      required: true,
    }),

    author: await input({
      message: "Author",
      default: config.metadata.author,
    }),

    publisher: await input({
      message: "Publisher",
    }),

    description: await editor({
      message: "Description",
      default: config.metadata.description,
    }),

    cover: await input({
      message: "Url for the cover image",
      default: config.metadata.coverUrl,
    }),

    tocTitle: await input({
      message: "Title of table of contents",
      default: "Table of Contents",
    }),

    chunks: await input({
      message:
        "Enter groupings for table of contents, non-digit character separated",
      default: "[10, 10]",
      transformer: (val, { isFinal }) =>
        isFinal ? `[${val.match(/\d+/g) ?? "no groups"}]` : val,
    }),

    lang: await input({
      message: "Two letter code for the book language",
      default: "en",
      validate: (val) => (val.match(/^[a-z][a-z]$/) ? true : "Two alphabet code only."),
    }),

    name: await input({
      message: "Generated epub file name",
      default: `tempFiles-${config.metadata.novelID}`,
      required: true
    }),

    regen: await confirm({
      message: "Regenerate temporary files?(if present)",
      default: false,
      transformer: (value) => (value ? "Yes" : "No"),
    }),

    deleteTemp: await confirm({
      message: "Delete temporary files after successful generation?",
      default: false,
      transformer: (value) => (value ? "Yes" : "No"),
    }),
  };

  config.end ??= Infinity;
  config.chunks = config.chunks.match(/\d+/g)?.map(num => parseInt(num)) ?? [];
  config.lang = config.lang.toLowerCase();

  genNovel(config);
} catch (e) {
  // silence errors from ctrl+c
  if (e.name !== 'ExitPromptError'){
    console.log(config);
    throw e;
  }
  else console.log("Hope to see you again!!👋👋");
}
}

main();