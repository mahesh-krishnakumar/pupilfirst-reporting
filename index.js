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

const submissionData = JSON.parse(
  fs.readFileSync(
    path.join(process.env.GITHUB_WORKSPACE, "submission_data.json")
  )
);

const reportFilePath = core.getInput("report_path");

const reportData = JSON.parse(
  fs.readFileSync(path.join(process.env.GITHUB_WORKSPACE, reportFilePath))
);

const variables = {
  submissionId: submissionData.id,
  description: reportData.report,
  status: reportData.status,
};

// most @actions toolkit packages have async methods
async function run() {
  const data = await graphQLClient.request(mutation, variables);
  console.log(JSON.stringify(data, undefined, 2));
}

let testMode = core.getBooleanInput("test_mode");

if (testMode) {
  console.log(reportData);
} else {
  run().catch((error) => console.log(error));
}
