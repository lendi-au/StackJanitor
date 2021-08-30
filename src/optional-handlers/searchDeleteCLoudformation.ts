import config from "../config";

import * as AWS from "aws-sdk";

import { Stack, Stacks } from "aws-sdk/clients/cloudformation";

// import * as fs from 'fs';

AWS.config.update({ region: config.DEFAULT_REGION });

const cloudFormation = new AWS.CloudFormation();

// const myFile = '/Users/jyu/Desktop/StackJanitor/src/optional-handlers/stacks/createstack-4.json';

// const body = fs.readFileSync(myFile);

// console.log(body.toString())

const allStacks = cloudFormation.describeStacks().promise();

function returnStackStatus(stacks: Stacks) {
  const stackStatus = [
    "CREATE_COMPLETE",
    "UPDATE_COMPLETE",
    "CREATE_FAILED",
    "ROLLBACK_FAILED",
    "ROLLBACK_COMPLETE",
    "DELETE_FAILED",
    "UPDATE_ROLLBACK_FAILED",
    "UPDATE_ROLLBACK_COMPLETE",
    "IMPORT_ROLLBACK_FAILED",
    "IMPORT_ROLLBACK_COMPLETE"
  ];
  stacks.filter(function(stack: Stack) {
    if (stackStatus.includes(stack.StackStatus)) {
      console.log(stack);
    }
  });
}

// const result  = cloudFormation.createStack({
//     StackName: 'test4',
//     TemplateBody: body.toString(),
//     Capabilities: [
//         "CAPABILITY_IAM",
//       ],
//     Tags: [
//         {
//             Key: 'stackjanitor',
//             Value: 'enabled',
//         },
//     ],
// }).promise();

// const result  = cloudFormation.updateStack({
//     StackName: 'meeting-planner',
//     TemplateBody: body.toString(),
//     Capabilities: [
//         "CAPABILITY_IAM",
//       ],
//     Tags: [
//     {
//         Key: 'stackjanitor',
//         Value: 'enabled',
//     },
//     ],
// }).promise();

// const result  = cloudFormation.getTemplate({
//     StackName: 'meeting-planner',
// }).promise();

// const result  = cloudFormation.listStacks({
//     StackStatusFilter: [
//        "UPDATE_COMPLETE",
//       ]
// }).promise();

// const result  = cloudFormation.deleteStack({
//     StackName: 'meeting-planner',
// }).promise();

const myAsync = async () => {
  const test = await allStacks;
  console.log("hello did you wait for me?");
  if (test.Stacks) {
    const gfd = returnStackStatus(test.Stacks);
    console.log(JSON.stringify(gfd));
  }
};

myAsync();

// const myAsync = async () => {
//     const test = await result
//     console.log('hello did you wait for me?')
//     console.log(test)
// }

//   myAsync();
