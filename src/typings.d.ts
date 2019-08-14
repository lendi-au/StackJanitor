declare module "stackjanitor" {
  import { int } from "aws-sdk/clients/datapipeline";
  export type parameterValue = "Environment";
  export type EventName = "UpdateStack" | "CreateStack" | "DeleteStack";

  export type parameterKey = {
    [parameterKey: string]: parameterValue;
  };

  export interface StackJanitorStatus {
    [Key: string]: any;
    event: CloudFormationEvent;
    results: {
      stackjanitor: string;
    };
  }

  export interface DynamoDBLog {
    event: CloudFormationEvent;
    expirationTime: number;
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
      eventTime: string;
      requestParameters: {
        parameters: parameterKey[];
        stackName: string;
      };
      responseElements: {
        stackId: string;
      };
    };
  }
}
