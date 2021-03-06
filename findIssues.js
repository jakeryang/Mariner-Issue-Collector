const fs = require('fs')
      path = require('path')
      moment = require('moment')
      mariner = require('oss-mariner')


function getFromEnvOrThrow(configField) {
    const value = process.env[configField];
    if (!value) {
        throw new Error(`${configField} is required`);
    }

    return value;
}

const token = getFromEnvOrThrow('MARINER_GITHUB_TOKEN');
const inputFilePath =
    process.env.MARINER_INPUT_FILE_PATH ||
    path.join(__dirname, 'InputFiles', 'inputData.json');
const outputFilePath =
    process.env.MARINER_OUTPUT_FILE_PATH ||
    path.join(__dirname, 'OutputFiles', 'outputData.json');

class FancyLogger {
    info(message) {
        console.log('***INFO: ' + message);
    }
    error(message) {
        console.log('***ERROR: ' + message);
    }
}

const logger = new FancyLogger();

logger.info(`Input:  ${inputFilePath}`);
logger.info(`Output: ${outputFilePath}`);

const contents = fs.readFileSync(inputFilePath, {
    encoding: 'utf8',
});
const countsByLibrary = JSON.parse(contents);
const repositoryIdentifiers = Object.keys(countsByLibrary);

const finder = new mariner.IssueFinder(logger);

function convertToRecord(issues) {
    const record = {};
    issues.forEach((issuesForRepo, repo) => {
        record[repo] = issuesForRepo;
    });
    const jsonFile = outputToJson(record);

    return jsonFile;
}

function outputToJson(record) {
    const noReplacer = undefined;
    const indent = 2;
    const jsonResults = JSON.stringify(record, noReplacer, indent);
    const data = fs.writeFileSync(outputFilePath, jsonResults);

    return data;
}

const labels = ['hacktoberfest', 'good+first+issue']

finder
    .findIssues(token, labels, repositoryIdentifiers)
    .then((issues) => {
        let issueCount = 0;
        issues.forEach((issuesForRepo) => {
            issueCount += issuesForRepo.length;
        });

        convertToRecord(issues);
        logger.info(`Found ${issueCount} issues in ${issues.size} projects\n`);
        logger.info(`Saved issue results to: ${outputFilePath}`);
    })
    .catch((err) => {
        logger.error(err.message);
        console.log(err);
    });
