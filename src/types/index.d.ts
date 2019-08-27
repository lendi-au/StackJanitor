declare module "stackjanitor" {
  export type parameterValue = "Environment";
  export type EventName = "UpdateStack" | "CreateStack" | "DeleteStack";

  export const TagName = "stackjanitor";

  export type parameterKey = {
    [parameterKey: string]: parameterValue;
  };

  export enum StackStatus {
    Enabled = "enabled",
    Disabled = "disabled"
  }

  export interface StackJanitorStatus {
    [Key: string]: any;
    event: CloudFormationEvent;
    results: {
      stackjanitor: StackStatus;
    };
  }

  export interface CustomTag {
    key: string;
    value: string;
  }

  export interface DynamoDbLog {
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
        tags: CustomTag[];
        parameters: parameterKey[];
        stackName: string;
      };
      responseElements: {
        stackId: string;
      };
    };
  }
}
