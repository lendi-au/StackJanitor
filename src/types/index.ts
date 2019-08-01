import { AWSError, Request } from "aws-sdk";
import { DescribeStacksOutput } from "aws-sdk/clients/cloudformation";

export type parameterValue = "Environment";
export type EventName = "UpdateStack" | "CreateStack" | "DeleteStack";

export type parameterKey = {
  [parameterKey: string]: parameterValue;
};

export enum CONST {
  TAG = "stackjanitor",
  ENABLED = "enabled",
  DISABLED = "disabled"
}

export interface describeStacks {
  (
    params: any,
    callback?: (err: AWSError, data: DescribeStacksOutput) => void
  ): Request<DescribeStacksOutput, AWSError>;
}

export interface CloudFormationEvent {
  id: string;
  detail: {
    userIdentity: {
      type: string;
      sessionContext: {
        sessionIssuer: {
          userName: string;
        };
      };
    };
    eventName: string;
    requestParameters: {
      parameters: parameterKey[];
      stackName: string;
    };
  };
}
