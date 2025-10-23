const path = require('path');
const { parseStringPromise, Builder } = require('xml2js');
const Zip = require('adm-zip');

async function transformToc(inputFile, chunks = []) {
    try {
        if (chunks.length === 0) return;
        const zip = Zip(inputFile);
        const toc = zip.getEntry(path.join('OEBPS', 'toc.xhtml'));

        if (!toc) {
            console.log("No toc.xhtml found, skipping TOC transformation");
            return;
        }

        const xml = await parseStringPromise(zip.readAsText(toc), { trim: true, explicitCharkey: true, explicitArray: true });

        if (!xml || !xml.html || !xml.html.body || !xml.html.body[0] || !xml.html.body[0].nav || !xml.html.body[0].nav[0] || !xml.html.body[0].nav[0].ol || !xml.html.body[0].nav[0].ol[0]) {
            console.log("TOC structure not as expected, skipping transformation");
            console.log("Available XML structure:", JSON.stringify(xml, null, 2));
            return;
        }

        let primeOl = structuredClone(xml.html.body[0].nav[0].ol[0]);
        const olAttr = structuredClone(primeOl.$);
        const liAttr = structuredClone(primeOl.li[0].$);

        let chaptersJump = 1;
        for (let t = 0; t < chunks.length; t++) {
            const mainOl = { $: olAttr, li: [] };

            for (let i = 0; i < primeOl.li.length; i += chunks[t]) {
                mainOl.li.push({
                    $: liAttr,
                    a: {
                        _: `Chapter ${(i * chaptersJump) + 1}-${(i + chunks[t]) * chaptersJump}`,
                        $: { href: "#" }
                    },
                    ol: {
                        $: olAttr,
                        li: [...primeOl.li.slice(i, i + chunks[t])]
                    }
                });
            }
            chaptersJump *= chunks[t];
            primeOl = mainOl;
        }
        xml.html.body[0].nav[0].ol[0] = primeOl;

        zip.updateFile(toc, new Builder().buildObject(xml));
        zip.writeZip(inputFile);
    } catch (e) {
        console.error("Error transforming toc", e);
        throw e;
    }
}

module.exports = { transformToc };