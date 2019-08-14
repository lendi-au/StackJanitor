# StackJanitor

[![Maintainability](https://api.codeclimate.com/v1/badges/36f6ce4580dafa42efc1/maintainability)](https://codeclimate.com/github/lendi-au/StackJanitor/maintainability)

StackJanitor will monitor deployed development AWS CloudFormation Stacks and eliminate unused stacks based on the events activities to mitigate cloud costs.

## How it works

![StackJanitor Architecture](./StackJanitor.png "StackJanitor Architecture")

CloudFormation stack creation event will produce a CloudTrail log which will trigger a step function/lambda to set a TTL for fresh stacks in a DynamoDB table.
CloudTrail logs from any update stack events concerning that development stack will re-invoke the Lambda function to refresh the TTL.

However, If stack resources remain unused for certain period of time, TTL expiration in the DynamoDB table will invoke the Lambda (responsible for cleaning up the stack) to perform a safe cleaning up process of the CFN stack.

## Installation

1. Clone the repo.
   `git clone https://github.com/lendi-au/StackJanitor.git`
2. Install node modules by running `npm install`
3. Install the Serverless Framework open-source CLI by running `npm install -g serverless`
4. Set AWS credentials. Serverless framework uses AWS credentials configured at `~/.aws/credentials`

   Follow [this guide](https://serverless.com/framework/docs/providers/aws/guide/credentials/) to setup AWS credentials for serverless.

5. Deploy StackJanitor by running `sls deploy`
6. Put a tag in CloudFormation stack `stackjanitor = "enabled"` to enable monitoring.

## Configuration

Set up default expiration period (TTL) in `serverless.yml` custom vars.

## Upcoming features

- Scheduled lambda to send notification of potential stack clean up process.
- Slack notification
- Email notification
- Refresh TTL by clicking link (hook) from Email/Slack message.
