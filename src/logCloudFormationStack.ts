import AWS from "aws-sdk";
import { Context } from "aws-lambda";
import { CloudFormationEvent, Environment } from "./types";
const stepFunctions = new AWS.StepFunctions();

const stateMachineName: string = "StackJanitor";

const getEnvironment = (event: CloudFormationEvent): Environment => {
  const parameters = event.detail.requestParameters.parameters;
  console.info(parameters);
  return "development";
};

export const index = async (event: CloudFormationEvent, _context: Context) => {
  // Need to grab environment parameter value

  // Check if the environment is development

  // if Development

  // if Env is Not Development

  console.info(event);
  console.info(getEnvironment);
  console.info(_context);
  console.info(stateMachineName);
  console.info(stepFunctions.listStateMachines());
};
