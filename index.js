const core = require("@actions/core");
const fs = require("fs");
const path = require("path");

const GraphQLClient = require("graphql-request").GraphQLClient;
const gql = require("graphql-request").gql;

const endpoint = process.env.REVIEW_END_POINT;

const graphQLClient = new GraphQLClient(endpoint, {
  headers: {
    authorization: `Bearer ${process.env.REVIEW_BOT_USER_TOKEN}`,
  },
});

const mutation = gql`
  mutation SubmissionReport(
    $submissionId: ID!
    description: String!
    $status: SubmissionReportStatus!
  ) {
    createSubmissionReports(
      submissionId: $submissionId
      description: $description
      status: $status
    ) {
      success
    }
  }
`;

let submissionData;

try {
  submissionData = JSON.parse(
    fs.readFileSync(
      path.join(process.env.GITHUB_WORKSPACE, "submission_data.json")
    )
  );
} catch (error) {
  throw error;
}

const reportFilePath = core.getInput("report_file_path");

console.log(submissionData);
console.log(path.join(process.env.GITHUB_WORKSPACE, reportFilePath));
console.log(reportFilePath);

let reportData;

if (reportFilePath != undefined) {
  try {
    reportData = JSON.parse(
      fs.readFileSync(path.join(process.env.GITHUB_WORKSPACE, reportFilePath))
    );
  } catch (error) {
    throw error;
  }
}

const statusInput = core.getInput("status");

const descriptionInput = core.getInput("description");

if (reportData == undefined && statusInput == undefined) {
  throw "One of report data path or status must be present";
}

const reportStatus = statusInput != undefined ? statusInput : reportData.status;

const reportDescription =
  descriptionInput != undefined ? descriptionInput : reportData.description;

const variables = {
  submissionId: submissionData.id,
  description: reportDescription,
  status: reportStatus,
};

async function run() {
  if (reportStatus != undefined && reportDescription != undefined) {
    const data = await graphQLClient.request(mutation, variables);
    console.log(JSON.stringify(data, undefined, 2));
  } else {
    throw "Report status or description missing";
  }
}

let testMode = core.getBooleanInput("test_mode");

if (testMode) {
  console.log(reportData);
} else {
  run().catch((error) => console.log(error));
}
