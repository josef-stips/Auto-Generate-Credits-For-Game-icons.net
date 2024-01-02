const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const folderPath = 'your/folder/path/to/all/svgs'; // Pfad zu deinem Ordner mit den .svg Dateien
const outputFile = 'CREDITS.TXT'; // Name der Ausgabedatei

async function getAuthorsForIcons(iconNames) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const authors = {};

    try {
        await page.goto('https://game-icons.net');
        await page.waitForSelector('#algolia-search');

        console.log(iconNames)

        for (let iconName of iconNames) {
            await page.type('#algolia-search', iconName);
            await page.waitForTimeout(1000); // wait for the results to load

            await page.waitForSelector('.aa-dataset-icons');
            const firstSuggestion = await page.$('.aa-dataset-icons');

            console.log(iconName, firstSuggestion);

            if (firstSuggestion) {
                await firstSuggestion.click();

                let authorElement = await page.waitForSelector('.author');
                let author = await page.evaluate(el => el.textContent, authorElement);
                let authorName = await author.replace(/^by (\w+) under CC BY 3.0$/, '$1');

                authors[iconName] = author;
            };
        };

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    };

    return authors;
};

async function WriteOutput(outputFile, outputMap) {
    // Write result in output file
    const outputPath = path.join(folderPath, outputFile); // the folder path for ex.
    const stream = fs.createWriteStream(outputPath, { flags: "a" });
    for (const iconName in outputMap) {
        const author = outputMap[iconName];

        stream.write(`${iconName} ${author}\n`);
    };
    stream.end();

    console.log(`The result is written in ${outputPath}.`);
};

// scan folder for svg files -> exract file names into array -> Search author for icon name on Game-icons.net -> write credit in output file
async function processFiles() {
    try {
        const fileNames = fs.readdirSync(folderPath);
        const creatorMap = [];

        for (const fileName of fileNames) {
            if (fileName.endsWith('.svg')) {
                const iconName = path.parse(fileName).name;
                creatorMap.push(iconName);
            };
        };
        console.log(creatorMap);

        getAuthorsForIcons(creatorMap)
            .then(authorsMap => {
                console.log('Autoren:', authorsMap);

                WriteOutput(outputFile, authorsMap);
            })
            .catch(error => {
                console.error('Error:', error);
            });

    } catch (error) {
        console.error('Error while loading file occured:', error);
    };
};

// start the processing
processFiles();