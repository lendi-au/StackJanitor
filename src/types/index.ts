export type parameterValue = "Environment";
export type StackTypeValue = "AWS::CloudFormation::Stack";
export type EventName = "UpdateStack" | "CreateStack" | "DeleteStack";
export type Environment =
  | "development"
  | "production"
  | "staging"
  | "management";

export type parameterKey = {
  [parameterKey: string]: parameterValue;
};

export interface CloudFormationStack {
  Type: StackTypeValue;
  Properties: {
    Parameters: {
      [key: string]: string;
    };
    Tags: {
      [key: string]: string;
    }[];
  };
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
    eventName: EventName;
    requestParameters: {
      parameters: parameterKey[];
      stackName: string;
    };
  };
}
