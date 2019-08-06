declare module "stackjanitor" {
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

  export interface DynamoDBStrem {
    ApproximateCreationDateTime: 1565073920;
    Keys: {
      expirationTime: { N: "1565675761664" };
      stackName: {
        S: "webhook-delivery-delivery-worker-COR-443-pipline-01-development";
      };
    };
    NewImage: {
      expirationTime: { N: "1565675761664" };
      stackName: {
        S: "webhook-delivery-delivery-worker-COR-443-pipline-01-development";
      };
    };
    SequenceNumber: "4004600000000000065604158";
    SizeBytes: 188;
    StreamViewType: "NEW_IMAGE";
  }
}
